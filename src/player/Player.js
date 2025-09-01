import * as CANNON from 'cannon';
import * as THREE from 'three';
import { getMaterial } from '../core/MaterialManager';
import LocalData from '../core/LocalData';
import MyEventEmitter from '../core/MyEventEmitter';
import { Pistol, Sword } from './Weapons';
import PlayerAnimator from './PlayerAnimator';
import { tryPlayerDamage, socket, tryUpdatePosition, tryUpdateState, tryApplyCC } from '../core/NetManager';
import GroundChecker from './GroundChecker';
import Health from './Health';
import StateManager from './playerStates/_StateManager';
import RunBoost from './RunBoost';

export default class Player extends THREE.Object3D {
    constructor(game, scene, { x = 0, y = 5, z = 0 }, isLocal = true, camera, netId) {
        super();
        this.game = game;
        this.scene = scene;
        this.position.set(x, y, z);
        this.camera = camera;
        this.isLocal = isLocal;
        this.name = LocalData.name || 'Player';
        this.netId = netId;
        game.graphicsWorld.add(this);
        this.skinCache = {};


        this.healthComponent = new Health();
        this.health = this.healthComponent.currentHealth;
        this.height = 1;
        this.radius = .4;
        this.mesh;
        this.body = null;
        this.mixer;
        this.animations = {};
        this.currentAnimState = null;
        this.currentPosition = new CANNON.Vec3(x, y, z);
        this.bodyMesh = null;
        this.meshes = [];
        this.setMesh();

        this.weapon = new Sword(this, scene);

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
            this.cameraArm.position.set(1, .8, 0);
            this.add(this.cameraArm);
            this.cameraArm.add(this.camera);

            const material = getMaterial('playerMaterial');
            const sphere = new CANNON.Sphere(1);

            const body = new CANNON.Body({
                position: this.currentPosition,
                mass: 1,
                fixedRotation: true,
                shape: sphere,
                material: material,
                collisionFilterGroup: 2,
                collisionFilterMask: -1,
            });
            this.body = body;
            this.body.id = 'player';
            game.physicsWorld.addBody(this.body);
            this.groundChecker = new GroundChecker(this.game.physicsWorld, this.body, this.height + .4, this.radius);

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
            this.stateManager = new StateManager(this);
            this.runBooster = new RunBoost(this);


            MyEventEmitter.on('KeyPressed', (key) => {
                if (key === 'KeyR') {
                    this.body.position.set(0, 5, 0);
                    this.body.velocity.set(0, 0, 0);
                }
            });
        } else {
            // Remote Player
            this.targetPos = new THREE.Vector3(x, y, z);
            this.targetRot = 0;
        }
    }

    update(dt, time) {
        if (!this.mesh) return;
        if (this.isLocal) {
            tryUpdatePosition({ pos: this.position, rot: this.rotation.y });
            tryUpdateState(this.getAnimState());
        } else {
            //Lerp position for remote players
            this.position.lerp(this.targetPos, 25 * dt);
            this.rotation.y += (this.targetRot - this.rotation.y) * 25 * dt;
        }
        if (this.body) {
            this.runBooster.update(dt, this.stateManager.currentStateName);
            if (this.stateManager) this.stateManager.update(dt, time);
            this.handleInput(dt, time);
            this.position.copy(this.body.position);
            LocalData.position = this.position;
        }
        if (this.animator) {
            this.animator.update(dt);
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
    // async setMesh(skinName, file = '/assets/KnightGirl.glb') {
    //     const { model, animations, bodyMesh } = await this.scene.setMesh(skinName, file, this);
    //     this.mesh = model;
    //     this.animator = new PlayerAnimator(this, model, animations);
    //     this.bodyMesh = bodyMesh;
    //     this.add(this.mesh);
    // }
    // if (this.skinCache[skinName]) {
    //     if (this.mesh !== this.skinCache[skinName].mesh) {
    //         this.remove(this.mesh);
    //         this.mesh = this.skinCache[skinName].mesh;
    //         this.animator = this.skinCache[skinName].animator;
    //         this.add(this.mesh);
    //     }
    //     return;
    // } else {
    //     this.scene.glbLoader.load(file, (gltf) => {
    //         const model = gltf.scene;
    //         model.position.set(0, -1, 0);
    //         model.scale.set(1, 1, 1);
    //         model.rotation.y = Math.PI;
    //         model.traverse((child) => {
    //             if (child.isMesh) {
    //                 child.castShadow = true;
    //                 child.receiveShadow = true;
    //                 child.userData.owner = this;
    //                 if (child.name.includes('BodyMesh')) {
    //                     this.bodyMesh = child;
    //                 }
    //             }
    //         });
    //         if (this.mesh) this.remove(this.mesh);
    //         this.add(model);
    //         this.mesh = model;
    //         this.animator = new PlayerAnimator(this, this.mesh, gltf.animations);
    //         this.skinCache[skinName] = {
    //             mesh: this.mesh,
    //             animator: this.animator
    //         };
    //     });
    // }
    handleInput(dt) {
        if (!this.input) return;
        // Rotate player
        this.rotation.y = this.input.yaw;        // Yaw
        this.cameraArm.rotation.x = this.input.pitch; // Pitch

        if (this.input.mice[0] && this.input.pointerLocked) {
            const direction = this.camera.getWorldDirection(new THREE.Vector3());
            if (this.weapon.use(performance.now(), this.position, direction)) {
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

    takeDamage(amount) {
        //Single player take damage
        if (this.isLocal) {
            this.health.takeDamage(amount);
        }
        // Networked player take damage
        if (!this.isLocal) {
            tryPlayerDamage(this, amount);
        }
    }
    applyHealth({ amount, reason }) {
        switch (reason) {
            case "damage":
                this.health.takeDamage(amount);
                break;
            case "heal":
                this.health.heal(amount);
                break;
            default:
                console.warn(`Unknown health change reason: ${reason}`);
                this.health.adjust(amount);
        }
    }
    takeCC(type, dir) {
        if (this.isLocal) {
            this.stateManager.setState('stunned');
        }
        if (!this.isLocal) {
            const cc = { type, x: dir.x, y: dir.y, z: dir.z };
            tryApplyCC(this, cc);
        }
    }
    applyCC({ type, x, y, z }) {
        const dir = new CANNON.Vec3(x, y, z);
        switch (type) {
            case 'knockback':
                this.stateManager.setState?.('knockback', dir);
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
    changeHealth(amount) {
        LocalData.health = Math.max(0, LocalData.health + amount);
        if (LocalData.health === 0) {
            console.log("Player has died.");
        }
        MyEventEmitter.emit('updateHealth', LocalData.health);
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