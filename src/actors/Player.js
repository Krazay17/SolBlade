import * as CANNON from 'cannon';
import * as THREE from 'three';
import { FBXLoader, GLTFLoader } from 'three/examples/jsm/Addons.js';
import { getMaterial } from '../core/MaterialManager';
import LocalData from '../core/LocalData';
import MyEventEmitter from '../core/GlobalEventEmitter';
import { IdleState, WalkState, JumpState } from '../core/PlayerStates';
import { Pistol } from '../core/Weapons';

export default class Player extends THREE.Object3D {
    constructor(game, scene, { x = 0, y = 5, z = 0 }, camera, isLocal = true) {
        super();
        game.graphicsWorld.add(this);
        this.game = game;
        this.scene = scene;
        this.position.set(x, y, z);
        this.camera = camera;
        this.isLocal = isLocal;
        this.input = game.input;

        this.height = 1;
        this.radius = .3;

        //this.debugCapsule = this.setupCapsule(this.height, this.radius);
        //this.add(this.debugCapsule);

        this.cameraArm = new THREE.Object3D();
        this.cameraArm.position.set(1, .8, 0);
        this.add(this.cameraArm);
        this.cameraArm.add(this.camera);

        this.mesh;
        // const loader = new GLTFLoader();
        // loader.load(
        //     '/assets/KnightBlade.glb',
        //     (gltf) => {
        //         const model = gltf.scene;
        //         model.position.set(0, 0, 0);
        //         model.scale.set(1, 1, 1); // Adjust size if needed
        //         model.traverse((child) => {
        //             if (child.isMesh) {
        //                 child.castShadow = true;
        //                 child.receiveShadow = true;
        //             }
        //         });
        //         this.mesh = model;
        //         this.mesh.castShadow = true;
        //         this.add(this.mesh);
        //     },
        //     (xhr) => {
        //         console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        //     },
        //     (error) => {
        //         console.error('Error loading model:', error);
        //     }
        // );

        const fbxLoader = new FBXLoader();
        fbxLoader.load('/assets/GirlKnight.fbx', (fbx) => {
            this.add(fbx);
            fbx.scale.set(0.01, 0.01, 0.01);
            fbx.position.set(0, -1, 0);
            fbx.rotation.y = Math.PI;
            this.mesh = fbx;
        })

        const material = getMaterial('playerMaterial');
        const sphere = new CANNON.Sphere(1);
        this.body = new CANNON.Body({
            position: new CANNON.Vec3(x, y, z),
            mass: 1,
            shape: sphere,
            fixedRotation: true,
            material: material,
        });
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
            walk: new WalkState(this),
            jump: new JumpState(this),
        }
        this.currentState = this.states['idle'];

        this.weapon = new Pistol();

        if (isLocal) {
            this.speed = 20;
            this.acceleration = 100;
            this.deceleration = 300;
            this.jump = 10;
        }
    }

    update(dt, time) {
        if (!this.body) return;
        if (this.currentState) {
            this.currentState.update(dt, this.input);
        }
        //Decelerate
        this.body.velocity.x /= 1.05;
        this.body.velocity.z /= 1.05;

        this.handleInput(dt, time);

        //Update visual position to physics position
        this.position.copy(this.body.position);
    }
    handleInput(dt) {
        if (!this.input) return;
        this.rotation.y = this.input.yaw;        // Yaw
        this.cameraArm.rotation.x = this.input.pitch; // Pitch

        if(this.input.mice[0]) {
            if (this.weapon.use(performance.now())) {
            }
        }

        if (this.input.keys['KeyG']) {
            this.changeHealth(-10);
            this.input.keys['KeyG'] = false; // Prevent continuous damage
        }
    }
    setState(stateName) {
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
}