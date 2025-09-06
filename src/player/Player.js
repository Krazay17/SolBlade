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
import RunBoost from './RunBoost';
import CameraFX from '../core/CameraFX';
import PlayerMovement from './PlayerMovement';
import DevMenu from '../ui/DevMenu';
import NamePlate from '../core/Nameplate';

export default class Player extends THREE.Object3D {
    constructor(game, scene, { x = 0, y = 1, z = 0 }, isLocal = true, camera, id, netData) {
        super();
        this.game = game;
        this.scene = scene;
        this.position.set(x, y, z);
        this.camera = camera;
        this.isLocal = isLocal;
        this.name = isLocal ? LocalData.name || 'Player' : netData.name || 'Player';
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

        this.weaponL = new Pistol(this, scene);
        this.weaponR = new Sword(this, scene);

        // Local Player setup
        if (isLocal) {
            this.input = game.input;

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
            this.groundChecker = new GroundChecker(this.game.physicsWorld, this.body, this.radius + .1, this.radius);


            this.movement = new PlayerMovement(this);
            this.runBooster = new RunBoost(this);
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
        if (this.isLocal) {
            tryUpdatePosition({ pos: this.position, rot: this.rotation.y });
            tryUpdateState(this.getAnimState());
            if (this.body) {
                this.runBooster.update(dt, this.stateManager.currentStateName);
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

    // from local
    changeHealth(reason, amount) {
        let netId;
        if (this.isLocal) {
            // Local player
            netId = netSocket.id;

            switch (reason) {
                case "damage":
                    this.setHealth(amount);
                    break;
                case "reset":
                    this.setHealth(100);
                    break;
            }
        } else {
            // Remote player
            netId = this.netId;

            switch (reason) {
                case "damage":
                    this.setHealth(amount);
                    break;
                case "reset":
                    this.setHealth(100);
                    break;
            }
        }

        netSocket.emit('playerHealthSend', { targetId: netId, reason, amount });
    }
    // from server
    applyHealth({ targetId, reason, amount, health }) {
        this.setHealth(health);
        switch (reason) {
            case "damage":
                console.log('damage!');
                break;
            case "reset":
                console.log('reset!');
                break;
        }
    }

    // call twice from local and server
    setHealth(newHealth) {
        this.health = newHealth;

        if (this.isLocal) {
            if (this.health === 0) {
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
        if (!this.isLocal) return;
        this.stateManager.setState('dead');
        netSocket.emit('playerDieSend', { targetId: netSocket.id });
    }
    // only local
    unDie() {
        if (!this.isLocal) return;
        this.stateManager.setState('idle');
        this.body.position.set(0, 1, 0);
        this.body.velocity.set(0, 0, 0);

        this.setHealth(100);
        netSocket.emit('playerHealthSend', { targetId: netSocket.id, reason: 'reset', amount: 100 });
    }

    takeCC(type, { dir, duration = 1000 }) {
        if (this.isLocal) {
            this.stateManager.setState('stunned');
        }
        if (!this.isLocal) {
            const cc = { type, dir, duration: 800 };
            netSocket.emit('playerCCSend', { targetId: this.netId, ...cc });
        }
    }
    applyCC({ type, dir, duration }) {
        this.tempVector.copy(dir);
        switch (type) {
            case 'stun':
                this.stateManager.setState?.('stun', { type, dir: this.tempVector, duration });
                break;
            case 'knockback':
                this.stateManager.setState?.('stun', { type, dir: this.tempVector, duration: 300 });
                this.body.velocity.copy(this.tempVector);
                break;
            default:
                console.warn(`Unknown CC type: ${type}`);
        }
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
}