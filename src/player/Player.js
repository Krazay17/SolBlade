import * as CANNON from 'cannon';
import * as THREE from 'three';
import { getMaterial } from '../core/MaterialManager';
import LocalData from '../core/LocalData';
import MyEventEmitter from '../core/MyEventEmitter';
import { Pistol, Sword } from './weapons/index';
import PlayerAnimator from './PlayerAnimator';
import { tryPlayerDamage, tryUpdatePosition, tryUpdateState, tryApplyCC, netSocket } from '../core/NetManager';
import GroundChecker from './GroundChecker';
import StateManager from './playerStates/_StateManager';
import CameraFX from '../core/CameraFX';
import PlayerMovement from './PlayerMovement';
import DevMenu from '../ui/DevMenu';
import NamePlate from '../core/Nameplate';
import Globals from '../utils/Globals';

export default class Player extends THREE.Object3D {
    constructor(game, scene, { x = 0, y = 1, z = 0 }, isRemote = false, camera, id, netData) {
        super();
        this.game = game;
        this.scene = scene;
        this.position.set(x, y, z);
        this.camera = camera;
        this.isRemote = isRemote;
        this.name = isRemote ? netData.name || 'Player' : LocalData.name || 'Player';
        this.netId = id || null;
        game.graphicsWorld.add(this);
        this.skinCache = {};

        this.isDead = false;
        this.height = 1;
        this.radius = 0.5;
        this.mesh;
        this.mixer;
        this.animations = {};
        this.currentAnimState = null;
        this.currentPosition = new CANNON.Vec3(x, y, z);
        this.bodyMesh = null;
        this.meshes = [];
        this.setMesh();


        this.health = netData?.health || LocalData.health || 100;
        this.energy = 100;
        this.energyRegen = 25;
        this.dashCost = 30;
        this.bladeDrain = -5; // per second

        this.weaponL = new Pistol(this, scene);
        this.weaponR = new Sword(this, scene);

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

            this.cameraArm = new THREE.Object3D();
            this.cameraArm.position.set(.5, 1, 0);
            this.add(this.cameraArm);
            this.camera.position.z = 1.5;
            this.cameraArm.add(this.camera);
            CameraFX.init(this.camera);
            this.createBody();
            this.groundChecker = new GroundChecker(this.game.physicsWorld, this.body, this.radius + .1, this.radius - .1);


            this.movement = new PlayerMovement(this);
            this.stateManager = new StateManager(this);

            this.devMenu = new DevMenu(this, this.movement);

            MyEventEmitter.on('KeyPressed', (key) => {
                if (key === 'KeyR') {
                    this.stateManager.setState('dead');
                }
            });
        } else {
            // Remote Player
            this.targetPos = new THREE.Vector3(x, y, z);
            this.targetRot = 0;
            this.namePlate = new NamePlate(this, this.height + 0.5);
        }
    }

    update(dt, time) {
        if (!this.mesh) return;

        // Local Player
        if (!this.isRemote) {
            tryUpdatePosition({ pos: this.position, rot: this.rotation.y });
            tryUpdateState(this.getAnimState());
            this.regenEnergy(this.energyRegen, dt);
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
            this.position.lerp(this.targetPos, 25 * dt);
            this.rotation.y += (this.targetRot - this.rotation.y) * 25 * dt;
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
        if (this.input.actionStates.blade) {
            this.tryEnterBlade();
        }
        if (this.input.keys['KeyF']) {
            const direction = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
            const scaledConvertedDirection = new CANNON.Vec3(direction.x, direction.y, direction.z).scale(2);
            this.body.position = this.body.position.vadd(scaledConvertedDirection);
            this.body.velocity.y = 0;
        }
        if (this.input.keys['Digit1']) {
            this.stateManager.tryEmote('rumbaDancing');
            CameraFX.shake(0.02, 125);
        }
        if (this.input.keys['Digit2']) {
            this.stateManager.tryEmote('twerk');
        }

        // Damage test
        if (this.input.keys['KeyG']) {
            this.changeHealth(-10);
            this.input.keys['KeyG'] = false; // Prevent continuous damage
        }
    }

    async setMesh(skinName = 'KnightGirl') {
        if (this.meshName === skinName) return;
        const newMesh = await this.scene.meshManager.createMesh(skinName);
        this.meshName = skinName;
        this.remove(this.mesh);
        this.mesh = newMesh;
        this.add(this.mesh);
        const meshBody = newMesh.meshBody;
        meshBody.userData.owner = this;
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
                contactEquationRelaxation: 50,
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

    takeDamage(attacker, dmg = {}, cc = {}) {
        let netId;
        if (this.isRemote) {
            netId = this.netId;
            this.setHealth(this.health - dmg.amount);
        } else {
            netId = netSocket.id;
            this.namePlate?.setHealth(this.health - dmg.amount);
        }
        netSocket.emit('playerDamageSend', { targetId: netId, dmg, cc });
    }

    applyDamage({ health, dmg, cc }) {
        const { type, amount } = dmg;
        const { stun, dir } = cc;
        if (amount > 0) {
            this.setHealth(health);
            if (this.isRemote) return;

            if (type === 'melee') {
                CameraFX.shake(0.2, 125);
            }
            if (stun > 0) {
                this.stateManager.setState('stun', stun);
            }
            console.log(dir);
            if (dir) {
                this.body.wakeUp();
                this.body.velocity.copy(dir);
            }
        }
    }
    // call twice from local and server
    setHealth(newHealth) {
        this.health = newHealth;
        if (!this.isRemote) {
            if (this.health <= 0) {
                this.die();
            }
            LocalData.health = newHealth;
            MyEventEmitter.emit('updateHealth', LocalData.health);
        } else {
            this.namePlate?.setHealth(newHealth);
        }
    }
    // only local
    die() {
        if (this.isRemote) return;
        this.stateManager.setState('dead');
        netSocket.emit('playerDieSend', { targetId: netSocket.id });
    }
    // only local
    unDie() {
        if (this.isRemote) return;
        this.stateManager.setState('idle');
        const spawnPoint = this.scene.getRespawnPoint();
        this.body.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z);
        this.body.velocity.set(0, 0, 0);

        this.setHealth(100);
        netSocket.emit('playerRespawnUpdate', { id: this.netId, health: this.health, pos: this.position });
    }

    floorTrace() {
        return this.groundChecker.isGrounded();
    }
    getState() {
        return this.stateManager.currentStateName ? this.stateManager.currentStateName : null;
    }
    destroy(id) {
        console.log(`Removing player ${id} from world`);
        if (this.body) {
            this.game.physicsWorld.removeBody(this.body);
            this.body = null;
        }
        if (this) {
            this.game.graphicsWorld.remove(this);
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
        if (amount === 0) return true;
        if (this.energy < amount) return false;
        this.energy -= amount;
        MyEventEmitter.emit('updateEnergy', this.energy);
        return true;
    }
    regenEnergy(amount, dt) {
        this.energy += amount * dt;
        if (this.energy > 100) this.energy = 100;
        if (this.energy < 0) this.energy = 0;
        MyEventEmitter.emit('updateEnergy', this.energy);
    }
    tryEnterBlade() {
        if (this.stateManager.currentStateName === 'blade') return;
        const neutral = this.movement.getInputDirection().clone().isZero();
        if (this.energy < this.dashCost) return false;
        const energyCost = neutral ? 0 : this.dashCost;
        if (this.stateManager.setState('blade', neutral)) {
            this.tryUseEnergy(energyCost);
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