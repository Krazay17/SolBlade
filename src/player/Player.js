import * as THREE from 'three';
import LocalData from '../core/LocalData';
import MyEventEmitter from '../core/MyEventEmitter';
import * as Weapon from './weapons/index';
import { tryUpdatePosition, netSocket } from '../core/NetManager';
import CameraFX from '../core/CameraFX';
import PlayerMovement from './PlayerMovement';
import DevMenu from '../ui/DevMenu';
import NamePlate from '../core/Nameplate';
import Globals from '../utils/Globals';
import soundPlayer from '../core/SoundPlayer';
import Inventory from './Inventory';
import GameScene from '../scenes/GameScene';
import Pawn from '../actors/Pawn';
import PlayerStateManager from './playerStates/PlayerStateManager';
import HitData from '../core/HitData';

export default class Player extends Pawn {
    /**
     * @param {GameScene} scene 
     */
    constructor(scene, data = {}) {
        if (!data.isRemote) {
            data.health = LocalData.health
            data.name = LocalData.name
        }
        super(scene, data, 'knightGirl', .5, 1);
        this.camera = Globals.camera;

        this.parry = false;
        this.energy = 100;
        this.dimmed = 0;
        this.crownMesh = null;
        this.energyRegen = 25;
        this.dashCost = 30;
        this.bladeDrain = -5; // per second

        soundPlayer.loadPosAudio('playerHit', '/assets/PlayerHit.mp3');

        // Local Player setup
        if (!this.isRemote) {
            this.input = Globals.input;
            Globals.playerInfo.setActor(this);

            this.direction = new THREE.Vector3();
            this.tempVector = new THREE.Vector3();

            /**@type {Weapon.Weapon} */
            this.weaponL = new Weapon.WeaponPistol(this, scene);
            /**@type {Weapon.Weapon} */
            this.weaponR = new Weapon.WeaponSword(this, scene);
            /**@type {Weapon.Weapon} */
            this.spell1 = null;
            /**@type {Weapon.Weapon} */
            this.spell2 = null;
            /**@type {Weapon.Weapon} */
            this.spell3 = null;
            /**@type {Weapon.Weapon} */
            this.spell4 = null;

            this.inventory = new Inventory(this);

            this.cameraArm = new THREE.Object3D();
            this.cameraArm.position.set(.333, .666, -.333);
            this.add(this.cameraArm);
            this.camera.position.z = 1.666;
            this.cameraArm.add(this.camera);
            CameraFX.init(this.camera);

            this.movement = new PlayerMovement(this);
            this.stateManager = new PlayerStateManager(this);
            this.devMenu = new DevMenu(this, this.movement);

            MyEventEmitter.on('KeyPressed', (key) => {
                if (key === 'KeyR') {
                    this.die('the void');
                }
            });

            MyEventEmitter.on('test', () => {
                this.parried();
            })

        } else {
            // Remote Player

            this.namePlate = new NamePlate(this, this.height);
            // !!!!pre load crown for net player!!!!
            if (this.data.hasCrown) {
                this.pickupCrown();
            }
        }
    }
    async pickupCrown() {
        if (!this.crownMesh) {
            this.crownMesh = await this.scene.meshManager.getMesh('crown', 0.4);
            this.crownMesh.position.set(0, 1.5, 0);
            this.crownMesh.scale.set(.4, .4, .4);
        }
        this.add(this.crownMesh);
    }

    dropCrown() {
        if (this.crownMesh) {
            this.remove(this.crownMesh);
        }
    }
    setSpell(slot, spell) {
        if (slot < 1 || slot > 4) return;
        const spellName = spell?.name || null;
        switch (spellName) {
            case 'Fireball':
                spell = new Weapon.WeaponFireball(this, this.scene, true);
                break;
            case 'Pistol':
                spell = new Weapon.WeaponPistol(this, this.scene, true);
                break;
            case 'Sword':
                spell = new Weapon.WeaponSword(this, this.scene, true);
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
    dropItem(item) {
        const { pos, dir } = this.getShootData();
        const dropPos = pos.add(dir.multiplyScalar(2));
        this.scene.actorManager.spawnActor('item', { item, pos: dropPos }, false, true);
    }
    getShootData() {
        const bulletPosition = this.position.clone().add(new THREE.Vector3(0, .7, 0));
        /**@type {THREE.Vector3} */
        const bulletDirection = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
        const camPosition = this.camera.getWorldPosition(new THREE.Vector3());
        return {
            pos: bulletPosition,
            dir: bulletDirection,
            camPos: camPosition,
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
        super.update(dt, time);
        if (!this.body) return;

        // Local Player
        if (!this.isRemote) {
            tryUpdatePosition({ pos: this.position, rot: this.rotation.y });
            this.addEnergy(this.energyRegen, dt);
            this.handleInput(dt, time);
            LocalData.position = this.position;
            LocalData.rotation = this.rotation.y;
            CameraFX.update(dt);
        }
    }

    handleInput(dt, time) {
        if (!this.input) return;
        // Rotate player
        this.rotation.y = this.input.yaw;        // Yaw
        this.cameraArm.rotation.x = this.input.pitch; // Pitch

        if (this.input.mice[0] && this.input.pointerLocked) {
            const direction = this.camera.getWorldDirection(new THREE.Vector3());
            if (this.stateManager.activeState.canExit() && this.weaponL.canUse(time)) {
                this.weaponL.use(performance.now(), this.position, direction);
            }
        }
        if (this.input.mice[2] && this.input.pointerLocked) {
            const direction = this.camera.getWorldDirection(new THREE.Vector3());
            if (this.stateManager.activeState.canExit() && this.weaponR.canUse(time)) {
                this.weaponR.use(performance.now(), this.position, direction);
            }
        }
        if (this.input.actionStates.spell1 && this.spell1) {
            if (this.stateManager.activeState.canExit() && this.spell1.canSpellUse(performance.now())) {
                this.spell1.spellUse(performance.now());
                MyEventEmitter.emit('spellUsed', { slot: '1', cd: this.spell1.cooldown });
            }
        }
        if (this.input.actionStates.spell2 && this.spell2) {
            if (this.stateManager.activeState.canExit() && this.spell2.canSpellUse(performance.now())) {
                this.spell2.spellUse(performance.now());
                MyEventEmitter.emit('spellUsed', { slot: '2', cd: this.spell2.cooldown });
            }
        }
        if (this.input.actionStates.spell3 && this.spell3) {
            if (this.stateManager.activeState.canExit() && this.stateManager.activeState.canExit() && this.spell3.canSpellUse(performance.now())) {
                this.spell3.spellUse(performance.now());
                MyEventEmitter.emit('spellUsed', { slot: '3', cd: this.spell3.cooldown });
            }
        }
        if (this.input.actionStates.spell4 && this.spell4) {
            if (this.stateManager.activeState.canExit() && this.spell4.canSpellUse(performance.now())) {
                this.spell4.spellUse(performance.now());
                MyEventEmitter.emit('spellUsed', { slot: '4', cd: this.spell4.cooldown });
            }
        }
        if (this.input.actionStates.blade) {
            this.tryEnterBlade();
        }
        if (this.input.actionStates.goHome && this.scene.levelLoaded) {
            this.scene.game.setScene('world1');
        }
        if (this.input.keys['KeyF']) {
            const direction = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
            const scaledConvertedDirection = new THREE.Vector3(direction.x, direction.y, direction.z).multiplyScalar(2);
            this.body.position = this.body.position.add(scaledConvertedDirection);
            this.body.velocity = { x: 0, y: 0, z: 0 };
        }
        if (this.input.keys['Digit6']) {
            this.stateManager.tryEmote('rumbaDancing');
        }
        if (this.input.keys['Digit7']) {
            this.stateManager.tryEmote('twerk');
        }
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
        console.log(this.name);
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
            MyEventEmitter.emit('parryUpdate', this.parry);
        }
    }

    parried(attacker) {
        const pos = attacker?.position ?? attacker ?? new THREE.Vector3(0, 0, 0);
        soundPlayer.playPosAudio('parry', this.position, 'assets/Parry.mp3');
        this.animationManager?.changeTimeScale(0, 600);
        if (!this.isRemote) {
            this.stateManager.setState('parry', { pos });
        }
    }

    hit(data) {
        super.hit(data);
    }
    applyHit(data, health) {
        super.applyHit(data, health);
        soundPlayer.playPosAudio('playerHit', this.position);
        if (this.isRemote) return;
        /**@type {HitData} */
        const { type, amount, stun, impulse, dim } = data;
        if (amount !== 0) {
            if (type === 'melee' || type === 'explosion') {
                CameraFX.shake(0.2, 125);
            }
            if (stun > 0) {
                this.stateManager.setState('stun', { stun, anim: 'knockback' });
            }
            if (impulse) {
                this.body.wakeUp();
                this.body.velocity = impulse;
            }
            if (dim) {
                this.setDimmed(dim);
            }
        }
    }
    healthChange(health) {
        super.healthChange(health);
        MyEventEmitter.emit('playerHealthChange', { player: this, health });
        if (this.isRemote) {
            this.namePlate?.setHealth(health);
            return;
        }
        if (!this.isRemote) {
            LocalData.health = health;
        }
    }
    // only local
    die() {
        if (this.isRemote) return;
        if (this.isDead) return;
        this.stateManager.setState('dead');
        MyEventEmitter.emit('iDied', this.lastHitData);
    }
    // only local
    unDie() {
        if (this.isRemote) return;
        const spawnPoint = this.scene.getRespawnPoint();
        if (!spawnPoint) spawnPoint = { x: 0, y: 1, z: 0 };
        this.body.position = { x: spawnPoint.x, y: spawnPoint.y, z: spawnPoint.z };
        this.body.velocity = { x: 0, y: 0, z: 0 };
        this.position.copy(this.body.position);
        this.lastHitData = null;
        this.health = this.maxHealth;
        this.isDead = false;
        this.stateManager.setState('idle');

        MyEventEmitter.emit('playerRespawn');
    }
    getAnimState() {
        return this.animationManager ? this.animationManager.currentAnimation : null;
    }
    setAnimState(anim) {
        if (this.animationManager) {
            this.animationManager.playAnimation(anim, true);
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
        if (this.stateManager.currentStateName === 'dash') return;
        const neutral = this.movement.getInputDirection().length() === 0;
        if (this.energy < this.dashCost) return false;
        const energyCost = neutral ? 0 : this.dashCost;
        if (!neutral && this.stateManager.setState('dash') && this.tryUseEnergy(energyCost)) return;
        if (this.stateManager.setState('blade')
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