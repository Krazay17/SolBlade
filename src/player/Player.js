import * as CANNON from 'cannon';
import * as THREE from 'three';
import { FBXLoader, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { getMaterial } from '../core/MaterialManager';
import LocalData from '../core/LocalData';
import MyEventEmitter from '../core/MyEventEmitter';
import { IdleState, RunState, JumpState, FallState, KnockbackState, DashState } from './PlayerStates';
import { Pistol, Sword } from './Weapons';
import PlayerAnimator from './PlayerAnimator';
import { tryPlayerDamage, socket, tryUpdatePosition, tryUpdateState, tryApplyCC } from '../core/NetManager';
import GroundChecker from '../core/GroundChecker';
import Health from './Health';
import StateManager from './StateManager';

export default class Player extends THREE.Object3D {
    constructor(game, scene, { x = 0, y = 5, z = 0 }, isLocal = true, camera, netId) {
        super();
        game.graphicsWorld.add(this);
        this.game = game;
        this.scene = scene;
        this.position.set(x, y, z);
        this.camera = camera;
        this.isLocal = isLocal;
        this.name = 'Player';
        this.netId = netId;


        this.health = new Health();
        this.height = 1;
        this.radius = .3;
        this.mesh;
        this.body = null;
        this.mixer;
        this.animations = {};


        const loader = new GLTFLoader();
        loader.load('/assets/KnightGirl.glb', (gltf) => {
            const model = gltf.scene;
            model.position.set(0, -1, 0);
            model.scale.set(1, 1, 1);
            model.rotation.y = Math.PI;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData.owner = this;
                }
            });
            this.add(model);
            this.mesh = model;
            this.animator = new PlayerAnimator(this.mesh, gltf.animations);
        });

        this.weapon = new Sword(this);

        //this.debugCapsule = this.setupCapsule(this.height, this.radius);
        //this.add(this.debugCapsule);
        if (isLocal) {
            this.input = game.input;

            this.speed = 5;
            this.acceleration = 300;
            this.deceleration = 300;
            this.jump = 9;

            this.cameraArm = new THREE.Object3D();
            this.cameraArm.position.set(1, .8, 0);
            this.add(this.cameraArm);
            this.cameraArm.add(this.camera);

            const material = getMaterial('playerMaterial');
            const sphere = new CANNON.Sphere(1);
            this.body = new CANNON.Body({
                position: new CANNON.Vec3(x, y, z),
                mass: 1,
                shape: sphere,
                fixedRotation: true,
                material: material,
                collisionFilterGroup: 2,
                collisionFilterMask: -1,
            });
            this.body.id = 'player';
            game.physicsWorld.addBody(this.body);
            this.groundChecker = new GroundChecker(this.game.physicsWorld, this.body);


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
            this.states = {
                idle: new IdleState(this),
                run: new RunState(this),
                jump: new JumpState(this),
                fall: new FallState(this),
                knockback: new KnockbackState(this),
                dash: new DashState(this),
            }
            this.setState('idle');

            MyEventEmitter.on('KeyPressed', (key) => {
                if (key === 'KeyR') {
                    this.body.position.set(0, 5, 0);
                    this.body.velocity.set(0, 0, 0);
                }
            });

        }
    }

    update(dt, time) {
        if (this.body) {
            if (this.stateManager) this.stateManager.update(dt, time);

            this.handleInput(dt, time);

            //Update visual position to physics position
            this.position.copy(this.body.position);
            LocalData.position = this.position;

        }
        if (this.isLocal) {
            tryUpdatePosition({ pos: this.position, rot: this.rotation.y });
            tryUpdateState(this.getAnimState());

        }
        if (this.animator) {
            this.animator.update(dt);
        }
    }
    handleInput(dt) {
        if (!this.input) return;
        // Rotate player
        this.rotation.y = this.input.yaw;        // Yaw
        this.cameraArm.rotation.x = this.input.pitch; // Pitch

        if (this.input.mice[0]) {
            const direction = this.camera.getWorldDirection(new THREE.Vector3());
            if (this.weapon.use(performance.now(), this.position, direction)) {
            }
        }

        // Damage test
        if (this.input.keys['KeyG']) {
            this.changeHealth(-10);
            this.input.keys['KeyG'] = false; // Prevent continuous damage
        }
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
                this.setState('knockback', dir);
                break;
            default:
                console.warn(`Unknown CC type: ${type}`);
        }
    }
    floorTrace() {
        return this.groundChecker.isGrounded();
    }

    getState() {
        return this.currentStateName ? this.currentStateName : null;
    }
    setState(stateName, data) {
        if (this.isLocal) {
            this.stateManager.setMovementState(stateName);
        }
    }
    removeFromWorld(id) {
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
            this.animator.setState(state);
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