import * as CANNON from 'cannon';
import * as THREE from 'three';
import { getMaterial } from '../core/MaterialManager';
import LocalData from '../core/LocalData';
import MyEventEmitter from '../core/MyEventEmitter';
import * as Weapon from './weapons/index';
import PlayerAnimator from './PlayerAnimator';
import { tryPlayerDamage, tryUpdatePosition, tryUpdateState, tryApplyCC, netSocket } from '../core/NetManager';
import StateManager from './playerStates/_StateManager';
import CameraFX from '../core/CameraFX';
import PlayerMovement from './PlayerMovement';
import DevMenu from '../ui/DevMenu';
import NamePlate from '../core/Nameplate';
import Globals from '../utils/Globals';
import soundPlayer from '../core/SoundPlayer';
import Inventory from './Inventory';
import ItemRandomizer from '../deprecated/ItemRandomizer';

export default class Player extends THREE.Object3D {
    constructor(game, scene, { x = 0, y = 1, z = 0 }, isRemote = false, camera, id, netData) {
        super();
        this.game = game;
        this.scene = scene;
        this.camera = camera;
        this.isRemote = isRemote;
        this.currentPosition = new CANNON.Vec3(x, y + 0.1, z);
        this.position.copy(this.currentPosition);
        this.name = isRemote ? netData.name || 'Player' : LocalData.name || 'Player';
        this.netId = id || null;
        game.graphicsWorld.add(this);
        this.skinCache = {};

        this.isDead = false;
        this.height = 1;
        this.radius = 0.5;
        this.parry = false;
        this.mesh = null;
        this.meshBody = null;
        this.mixer;
        this.animations = {};
        this.currentAnimState = isRemote ? netData.state || 'idle' : 'idle';
        this.bodyMesh = null;
        this.meshes = [];
        this.setMesh();

        this.health = netData?.health || LocalData.health || 100;
        this.energy = 100;
        this.dimmed = 0;
        this.crownMesh = null;
        this.energyRegen = 25;
        this.dashCost = 30;
        this.bladeDrain = -5; // per second

        soundPlayer.loadPosAudio('playerHit', '/assets/PlayerHit.mp3');

        // Local Player setup
        if (!isRemote) {
            this.input = game.input;
            Globals.playerInfo.setActor(this);

            this.maxSpeed = 5;
            this.acceleration = 300;
            this.deceleration = 300;
            this.jump = 9;

            this.direction = new CANNON.Vec3();
            this.tempVector = new THREE.Vector3();


            this.weaponL = new Weapon.Pistol(this, scene);
            this.weaponR = new Weapon.Sword(this, scene);
            this.spell1 = null;
            this.spell2 = null;
            this.spell3 = null;
            this.spell4 = null;
            this.inventory = new Inventory(this);

            this.cameraArm = new THREE.Object3D();
            this.cameraArm.position.set(.5, 1, 0);
            this.add(this.cameraArm);
            this.camera.position.z = 1.5;
            this.cameraArm.add(this.camera);
            CameraFX.init(this.camera);
            this.createBody();

            this.movement = new PlayerMovement(this);
            this.stateManager = new StateManager(this);
            this.devMenu = new DevMenu(this, this.movement);

            MyEventEmitter.on('KeyPressed', (key) => {
                if (key === 'KeyR') {
                    this.die('the void');
                }
            });

            MyEventEmitter.on('debugTest', () => {
                console.log(this.randomTest?.getRandomItem())
            });

        } else {
            // Remote Player
            this.targetPos = new THREE.Vector3(x, y, z);
            this.targetRot = 0;
            this.namePlate = new NamePlate(this, this.height + 0.5);

            // !!!!pre load crown for net player!!!!
            if (netData && netData.hasCrown) {
                this.pickupCrown();
            }
        }
    }

    async pickupCrown() {
        if (!this.crownMesh) {
            this.crownMesh = await this.scene.meshManager.getMesh('crown');
            this.crownMesh.position.set(0, 2, 0);
        }
        this.add(this.crownMesh);
    }

    getMeshBody() {
        return this.meshBody;
    }

    dropCrown() {
        if (this.crownMesh) {
            this.remove(this.crownMesh);
        }
    }

    dropItem(item) {
        const loc = this.getShootData()

        MyEventEmitter.emit('dropItem', item);
    }

    setSpell(slot, spell) {
        if (slot < 1 || slot > 4) return;
        const spellName = spell?.name || null;
        switch (spellName) {
            case 'Fireball':
                spell = new Weapon.Fireball(this, this.scene, true);
                break;
            case 'Pistol':
                spell = new Weapon.Pistol(this, this.scene, true);
                break;
            case 'Sword':
                spell = new Weapon.Sword(this, this.scene, true);
                break;
            default:
                spell = null;
                break;
        }
        if (!spell) {
            this[`spell${slot}`] = null;
            return;
        }
        this[`spell${slot}`] = spell;
    }

    getShootData() {
        const bulletPosition = this.position.clone().add(new THREE.Vector3(0, .7, 0));
        const bulletDirection = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
        return {
            pos: bulletPosition,
            dir: bulletDirection
        };
    }

    setDimmed(duration) {
        if (duration <= 0) return;
        this.dimmed = performance.now() + duration;
    }

    getDimmed() {
        return this.dimmed ? this.dimmed > performance.now() : false;
    }

    update(dt, time) {
        if (!this.mesh) return;

        // Local Player
        if (!this.isRemote) {
            tryUpdatePosition({ pos: this.position, rot: this.rotation.y });
            tryUpdateState(this.getAnimState());
            this.addEnergy(this.energyRegen, dt);
            if (this.body) {
                if (this.movement) this.movement.update(dt);
                if (this.stateManager) this.stateManager.update(dt, time);
                this.handleInput(dt, time);
                this.position.copy(this.body.position);
                LocalData.position = this.position;
                CameraFX.update(dt);
            }
        } else {
            // Remote Player
            if (this.position.distanceToSquared(this.targetPos) > 2) {
                this.position.copy(this.targetPos);
            } else {
                this.position.lerp(this.targetPos, 60 * dt);
            }
            if (Math.abs(this.rotation.y - this.targetRot) > 5) {
                this.rotation.y = this.targetRot;
            } else {
                this.rotation.y += (this.targetRot - this.rotation.y) * 60 * dt;
            }
        }

        // Local and Remote Player
        if (this.animator) {
            this.animator.update(dt);
        }
    }

    handleInput(dt) {
        if (!this.input) return;
        // Rotate player
        this.rotation.y = this.input.yaw;        // Yaw
        this.cameraArm.rotation.x = this.input.pitch; // Pitch

        if (this.input.mice[0] && this.input.pointerLocked) {
            const direction = this.camera.getWorldDirection(new THREE.Vector3());
            if (this.weaponL.use(performance.now(), this.position, direction)) {
            }
        }
        if (this.input.mice[2] && this.input.pointerLocked) {
            const direction = this.camera.getWorldDirection(new THREE.Vector3());
            if (this.weaponR.use(performance.now(), this.position, direction)) {
            }
        }
        if (this.input.actionStates.spell1 && this.spell1) {
            if (this.spell1.spellUse(performance.now())) {
                MyEventEmitter.emit('spellUsed', { slot: '1', cd: this.spell1.cooldown });
            }
        }
        if (this.input.actionStates.spell2 && this.spell2) {
            if (this.spell2.spellUse(performance.now())) {
                MyEventEmitter.emit('spellUsed', { slot: '2', cd: this.spell2.cooldown });
            }
        }
        if (this.input.actionStates.spell3 && this.spell3) {
            if (this.spell3.spellUse(performance.now())) {
                MyEventEmitter.emit('spellUsed', { slot: '3', cd: this.spell3.cooldown });
            }
        }
        if (this.input.actionStates.spell4 && this.spell4) {
            if (this.spell4.spellUse(performance.now())) {
                MyEventEmitter.emit('spellUsed', { slot: '4', cd: this.spell4.cooldown });
            }
        }
        if (this.input.actionStates.blade) {
            this.tryEnterBlade();
        }
        if (this.input.keys['KeyF']) {
            const direction = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
            const scaledConvertedDirection = new CANNON.Vec3(direction.x, direction.y, direction.z).scale(2);
            this.body.position = this.body.position.vadd(scaledConvertedDirection);
            this.body.velocity.y = 0;
        }
        if (this.input.keys['Digit6']) {
            this.stateManager.tryEmote('rumbaDancing');
        }
        if (this.input.keys['Digit7']) {
            this.stateManager.tryEmote('twerk');
        }
    }

    async setMesh(skinName = 'KnightGirl') {
        if (this.meshName === skinName) return;
        const newMesh = await this.scene.meshManager.createSkeleMesh(skinName);
        this.meshName = skinName;
        this.remove(this.mesh);
        this.mesh = newMesh;
        this.add(this.mesh);
        const meshBody = newMesh.meshBody;
        meshBody.userData.owner = this;
        this.meshBody = meshBody;
        this.scene.actorMeshes.push(meshBody);
        this.animator = new PlayerAnimator(this, newMesh, newMesh.animations);
    }

    createBody() {
        const material = getMaterial('playerMaterial');
        const contactMaterial = new CANNON.ContactMaterial(
            material,
            getMaterial('defaultMaterial'),
            {
                friction: 0,
                restitution: 0,
                contactEquationRelaxation: 100,
                id: 'playerGroundContact',
            });
        this.game.physicsWorld.addContactMaterial(contactMaterial);
        const sphere = new CANNON.Sphere(this.radius);
        //const topSphere = new CANNON.Sphere(this.radius);

        this.body = new CANNON.Body({
            shape: sphere,
            position: this.currentPosition,
            mass: 1,
            fixedRotation: true,
            material: material,
            collisionFilterGroup: 2,
            collisionFilterMask: -1,
        });
        // this.body.addShape(topSphere, new CANNON.Vec3(0, this.radius * 2, 0));
        this.game.physicsWorld.addBody(this.body);
        this.body.id = 'player';
        if (!this.scene.levelLoaded) {
            this.body.sleep();
            MyEventEmitter.once('levelLoaded', () => {
                this.body.wakeUp();
            });
        }
        // this.body.addShape(sphere, new CANNON.Vec3(0, this.radius * 2, 0));
        // this.body.addShape(sphere, new CANNON.Vec3(0, this.radius * 4, 0));
        // this.scene.glbLoader.load('/assets/capsule.glb', (gltf) => {
        //     let poly;
        //     gltf.scene.traverse((child) => {
        //         if (child.isMesh) {
        //             poly = glbToPoly(child);
        //             this.body.addShape(poly, new CANNON.Vec3(0, this.height / 2, 0));
        //         }
        //     });
        // });

        // this.body.addEventListener('collide', (event) => {
        //     this.isTouching = true;
        // });
        // MyEventEmitter.on('preUpdate', () => {
        //     this.isTouching = false;
        // });
    }

    getCameraDirection() {
        this.camera.getWorldDirection(this.tempVector);
        return this.tempVector;
    }

    getInputDirection(z = 0) {
        this.direction.set(0, 0, 0);

        // Gather input directions
        if (this.input.keys['KeyW']) this.direction.z -= 1;
        if (this.input.keys['KeyS']) this.direction.z += 1;
        if (this.input.keys['KeyA']) this.direction.x -= 1;
        if (this.input.keys['KeyD']) this.direction.x += 1;

        if (this.direction.length() === 0) {
            this.direction.z = z;
        }

        const { rotatedX, rotatedZ } = this.rotateInputVector(this.direction);

        // Input direction as a vector
        this.direction.set(rotatedX, 0, rotatedZ);
        this.direction.normalize();
        return this.direction;
    }

    rotateInputVector(dir) {
        // Rotate input direction by controller yaw
        const yaw = this.input.yaw;
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);

        const rotatedX = dir.x * cosYaw + dir.z * sinYaw;
        const rotatedZ = -dir.x * sinYaw + dir.z * cosYaw;

        return { rotatedX, rotatedZ };
    }

    setName(newName) {
        this.name = newName;
        this.namePlate?.setName(newName);
    }


    setEnergy(newEnergy) {
        this.energy = newEnergy;
        this.namePlate?.setEnergy(newEnergy);
    }

    infoUpdate() {
        socket.on('playerInfoUpdate', (data) => {
            const { name, health, mana, money } = data;
            this.namePlate.infoUpdate({ name, health, mana, money });
        });
    }

    setParry(doesParry) {
        if (this.parry !== doesParry) {
            this.parry = doesParry;
            MyEventEmitter.emit('updateParry', this.parry);
        }
    }

    parried(attacker) {
        const pos = attacker.position || attacker;
        soundPlayer.playPosAudio('parry', this.position, 'assets/Parry.mp3');
        this.animator?.hitFreeze(600, 0, 1);

        if (!this.isRemote) {
            this.stateManager.setState('parry', { duration: 600, pos });
        } else {
            clearTimeout(this.parryTimeoutId);
            this.parryTimeoutId = setTimeout(() => {
                this.animator?.hitFreeze(300, -.5, 1);
            }, 300);
        }
    }

    takeDamage(attacker, dmg = { amount: 0 }, cc = {}) {
        let netId;
        this.setHealth(this.health - dmg.amount);
        if (this.isRemote) {
            netId = this.netId;
        } else {
            netId = netSocket.id;
        }
        netSocket.emit('playerDamageSend', { attacker: attacker.netId, targetId: netId, dmg, cc });
    }

    applyDamage({ attacker, health, dmg, cc }) {
        this.setHealth(health, attacker);
        soundPlayer.playPosAudio('playerHit', this.position);
        if (this.isRemote) return;
        const { type, amount } = dmg;
        const { stun, dir, dim, dur } = cc;
        if (amount > 0) {
            if (type === 'melee' || type === 'explosion') {
                CameraFX.shake(0.2, 125);
            }
            if (stun > 0) {
                this.stateManager.setState('stun', { stun, anim: 'knockback' });
            }
            if (dir) {
                if (!stun) {
                    this.stateManager.setState('knockback', { dur: dur || 300 });
                }
                this.body.wakeUp();
                this.body.velocity.copy(dir);
            }
            if (dim) {
                this.setDimmed(dim);
            }
        }
    }
    takeHealing(dealer, heal = {}) {
        this.setHealth(Math.min(100, this.health + heal.amount));
        MyEventEmitter.emit('takeHealing', { dealer, heal });
    }
    applyHealing(health, { dealer, heal }) {
        this.setHealth(health, dealer)
    }
    // call twice from local and server
    setHealth(newHealth, dealer = null) {
        this.health = Math.min(100, newHealth);
        if (!this.isRemote) {
            if (this.health <= 0) {
                this.die(dealer);
            }
            LocalData.health = newHealth;
            MyEventEmitter.emit('updateHealth', this.health);
        } else {
            this.namePlate?.setHealth(newHealth);
        }
        MyEventEmitter.emit('playerHealthChange', { player: this, health: this.health });
    }
    // only local
    die(source = null) {
        if (this.isRemote) return;
        this.stateManager.setState('dead');
        MyEventEmitter.emit('playerDied', { player: this, source });
    }
    // only local
    unDie() {
        if (this.isRemote) return;
        const spawnPoint = this.scene.getRespawnPoint();
        this.body.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        this.body.velocity.set(0, 0, 0);
        this.setHealth(100);

        this.stateManager.setState('idle');

        MyEventEmitter.emit('playerRespawn', { health: this.health });
        netSocket.emit('playerRespawnUpdate', { id: this.netId, health: this.health, pos: this.position });
    }

    getState() {
        return this.stateManager.currentStateName ? this.stateManager.currentStateName : null;
    }
    destroy(id) {
        if (this.body) {
            this.game.physicsWorld.removeBody(this.body);
            this.body = null;
        }
        if (this) {
            this.game.graphicsWorld.remove(this);
        }
        if (this.mesh) {
            this.mesh = null;
        }
    }
    getAnimState() {
        return this.animator ? this.animator.stateName : null;
    }
    setAnimState(state) {
        if (this.animator) {
            this.animator.setAnimState(state);
        }
    }
    setupCapsule(height, radius) {
        const capsuleGeo = new THREE.CapsuleGeometry(radius, height, 4, 8);
        const capsuleMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);

        return capsule;
    }
    playerNetData() {
        return {
            pos: { x: this.position.x, y: this.position.y, z: this.position.z },
            rot: this.rotation.y,
            state: this.getAnimState(),
        };
    }
    tryUseEnergy(amount) {
        if (this.getDimmed()) return false;
        if (amount === 0) return true;
        if (this.energy < amount) return false;
        this.energy -= amount;
        MyEventEmitter.emit('updateEnergy', this.energy);
        return true;
    }
    addEnergy(amount, dt) {
        this.energy += dt ? amount * dt : amount;
        if (this.energy > 100) this.energy = 100;
        if (this.energy < 0) this.energy = 0;
        MyEventEmitter.emit('updateEnergy', this.energy);
    }
    tryEnterBlade() {
        if (this.stateManager.currentStateName === 'blade') return;
        if (this.stateManager.currentStateName === 'bladeJump') return;
        const neutral = this.movement.getInputDirection().clone().isZero();
        if (this.energy < this.dashCost) return false;
        const energyCost = neutral ? 0 : this.dashCost;
        if (this.stateManager.setState('blade', neutral)
            && this.tryUseEnergy(energyCost)) {

            this.energyRegen = this.bladeDrain;
            MyEventEmitter.emit('updateEnergy', this.energy);
            return true;
        }
        return false;
    }
    tryExitBlade() {
        if (this.stateManager.setState('idle')) {
            this.energyRegen = 25;
            return true;
        }
        return false;
    }
}