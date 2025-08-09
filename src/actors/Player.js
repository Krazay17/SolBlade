import * as THREE from 'three';
import Input from '../core/Input';
import { addPhysics } from '../core/Physics';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

export default class Player {
    constructor(x, y, z, scene, camera) {
        this.scene = scene;
        this.camera = camera;
        // this.mesh = new THREE.Mesh(
        //     new THREE.BoxGeometry(1, 1, 1),
        //     new THREE.MeshStandardMaterial({
        //         color: 0xffff00,
        //         roughness: 0.5, // matte vs shiny
        //         metalness: 0.3  // metallic look
        //     })
        // );
        // this.mesh.position.set(x, y, z);
        // this.mesh.castShadow = true;

        const loader = new GLTFLoader();
        this.cameraArm = new THREE.Object3D();
        this.cameraArm.position.set(0, 1.2, 0);

        loader.load(
            '/assets/KnightBlade.glb',
            (gltf) => {
                const model = gltf.scene;
                model.position.set(0, 0, 0);
                model.scale.set(1, 1, 1); // Adjust size if needed
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                this.scene.add(model);
                this.mesh = model;
                this.mesh.position.set(x, y, z);
                this.mesh.castShadow = true;
                this.mesh.add(this.cameraArm);
                this.cameraArm.add(this.camera);
                this.mesh.height = 1;
                addPhysics(this.mesh);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading model:', error);
            }
        );


        Input.init();

        this.camDirection = new THREE.Vector3();
        this.speed = 15;
        this.maxJump = 100;
        this.jump = 0;

        let yaw = 0;
        let pitch = 0;

        // Lock on click
        document.addEventListener('click', () => {
            document.body.requestPointerLock();
        });

        // Mouse movement (only works while locked)
        document.addEventListener('mousemove', (event) => {
            if (document.pointerLockElement === document.body) {
                const sensitivity = 0.002;
                yaw -= event.movementX * sensitivity;
                pitch -= event.movementY * sensitivity;
                pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

                this.mesh.rotation.y = yaw;        // Yaw
                this.cameraArm.rotation.x = pitch; // Pitch
            }
        });

    }

    update(dt) {
        let forward = 0;
        let strafe = 0;

        if (Input.keys['KeyW']) forward += this.speed;
        if (Input.keys['KeyS']) forward -= this.speed;
        if (Input.keys['KeyA']) strafe -= this.speed;
        if (Input.keys['KeyD']) strafe += this.speed;
        if (Input.keys['Space']) {
            if (this.jump < this.maxJump) {
                this.mesh.position.y += .25;
                this.jump += 200 * dt;
                console.log(this.jump);
            }
        } else {
            this.jump = 0;
        }

        if (forward !== 0 || strafe !== 0) {
            let dir = this.movementDirection(dt, forward, strafe);
            if (dir.length() > 0) dir.normalize().multiplyScalar(this.speed * dt);
            this.mesh.position.add(dir);
        }
    }

    movementDirection(dt, speed, strafe = 0) {
        let forward = new THREE.Vector3();
        let right = new THREE.Vector3();

        // Get forward direction from camera (and ignore vertical tilt)
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        // Right vector = forward × up
        right.crossVectors(forward, this.camera.up).normalize();

        // Combine forward/backward and left/right
        let direction = new THREE.Vector3();
        direction.addScaledVector(forward, speed);  // W/S
        direction.addScaledVector(right, strafe);   // A/D

        // Apply delta time
        direction.multiplyScalar(dt);

        return direction;
    }

}