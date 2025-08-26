import * as CANNON from 'cannon';
import * as THREE from 'three';
import { FBXLoader, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { getMaterial } from '../core/MaterialManager';
import LocalData from '../core/LocalData';
import MyEventEmitter from '../core/MyEventEmitter';
import { IdleState, RunState, JumpState } from '../core/PlayerStates';
import { Pistol } from '../core/Weapons';
import PlayerAnimator from '../core/PlayerAnimator';
import { socket } from '../core/NetManager';

export default class Player extends THREE.Object3D {
    constructor(game, scene, { x = 0, y = 5, z = 0 }, isLocal = true, camera) {
        super();
        game.graphicsWorld.add(this);
        this.game = game;
        this.scene = scene;
        this.position.set(x, y, z);
        this.camera = camera;
        this.isLocal = isLocal;

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
                }
            });
            this.add(model);
            this.mesh = model;
            this.animator = new PlayerAnimator(this.mesh, gltf.animations);
            this.animator.setState('idle');
        });

        this.weapon = new Pistol(game.graphicsWorld);

        //this.debugCapsule = this.setupCapsule(this.height, this.radius);
        //this.add(this.debugCapsule);
        if (isLocal) {
            this.input = game.input;

            this.speed = 10;
            this.acceleration = 100;
            this.deceleration = 300;
            this.jump = 10;

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
                collisionFilterGroup: 1,
            });
            this.body.id = 'player';
            game.physicsWorld.addBody(this.body);


            const contactMaterial = new CANNON.ContactMaterial(
                material,
                getMaterial('defaultMaterial'),
                {
                    friction: 0,
                    restitution: 0,
                    contactEquationRelaxation: 50,
                });
            this.game.physicsWorld.addContactMaterial(contactMaterial);

            this.states = {
                idle: new IdleState(this),
                run: new RunState(this),
                jump: new JumpState(this),
            }
            this.currentState = this.states['idle'];

            MyEventEmitter.on('KeyPressed', (key) => {
                if (key === 'KeyR') {
                    this.body.position.set(0, 5, 0);
                    this.body.velocity.set(0, 0, 0);
                }
            })
        }
    }

    update(dt, time) {
        if (this.body) {
            if (this.currentState) {
                this.currentState.update(dt, this.input);
            }

            this.handleInput(dt, time);

            //Update visual position to physics position
            this.position.copy(this.body.position);
            LocalData.position = this.position;
            socket.emit('playerNetData', this.playerNetData());
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
    floorTrace() {
        const down = new CANNON.Vec3(0, -1, 0); // Direction of ray
        const rayLength = this.height + .2; // Slightly below player
        const origin = this.body.position.clone(); // Ray starts at player position
        const result = new CANNON.RaycastResult();

        // Create the ray
        const ray = new CANNON.Ray(origin, down);

        ray.intersectWorld(this.game.physicsWorld, {
            from: origin,
            to: origin.vadd(down.scale(rayLength)),
            collisionFilterMask: -1,
            collisionFilterGroup: 1,
            skipBackfaces: true,
            result: result
        });
        return result.hasHit;
    }
    getState() {
        return this.currentStateName ? this.currentStateName : null;
    }
    setState(stateName) {
        this.currentStateName = stateName;
        if (this.isLocal) {
            if (this.currentState) {
                this.currentState.exit();
            }
            this.currentState = this.states[stateName];
            if (this.currentState) {
                this.currentState.enter();
            } else {
                console.warn(`State ${stateName} does not exist.`);
            }
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
            pos: this.position,
            rot: this.rotation.y,
            state: this.getAnimState(),
        };
    }
}