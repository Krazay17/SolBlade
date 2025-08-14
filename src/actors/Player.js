import * as THREE from 'three';
import Input from '../core/Input';
import { Physics } from '../core/Physics';
import { addPhysics } from '../core/Physics';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

export default class Player {
    constructor(x = 0, y = 25, z = 0, scene, camera, gameScene) {
        this.scene = scene;
        this.camera = camera;
        this.gameScene = gameScene;


        this.capsule = this.setupCapsule();
        this.capsule.position.set(x, 2, z);
        addPhysics(this.capsule);

        this.physics = new Physics(gameScene.worldMesh);

        this.cameraArm = new THREE.Object3D();
        this.cameraArm.position.set(1, .8, 0);
        this.capsule.add(this.cameraArm);
        this.cameraArm.add(this.camera);

        Input.init();

        this.mesh;
        const loader = new GLTFLoader();
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
                this.mesh = model;
                this.mesh.castShadow = true;
                this.capsule.add(this.mesh);
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error('Error loading model:', error);
            }
        );

        this.mouseCapture();

        this.speed = 15;
        this.jump = 1;


    }

    update(dt) {
        let forward = 0;
        let strafe = 0;

        if (Input.keys['KeyW']) forward += this.speed;
        if (Input.keys['KeyS']) forward -= this.speed;
        if (Input.keys['KeyA']) strafe -= this.speed;
        if (Input.keys['KeyD']) strafe += this.speed;
        if (Input.keys['Space']) {
            if (this.jump < 20) {
                this.capsule.velocity.y = this.jump;
                this.jump += 200 * dt;
                this.physics.moveCapsule(this.capsule, new THREE.Vector3(0, 1, 0));
            }
        } else {
            this.jump = 1;
        }

        if (forward !== 0 || strafe !== 0) {
            let dir = this.movementDirection(dt, forward, strafe);
            if (dir.length() > 0) dir.normalize().multiplyScalar(this.speed * dt);
            //this.capsule.position.add(dir);
            this.physics.moveCapsule(this.capsule, dir)
        }
        this.updateCapsuleCollision();
    }

    mouseCapture() {
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

                this.capsule.rotation.y = yaw;        // Yaw
                this.cameraArm.rotation.x = pitch; // Pitch
            }
        });
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

    setupCapsule() {
        const radius = .35;
        const height = 1;

        const capsuleGeo = new THREE.CapsuleGeometry(radius, height, 4, 8);
        const capsuleMat = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
        const capsule = new THREE.Mesh(capsuleGeo, capsuleMat);
        this.scene.add(capsule);

        capsule.name = 'PlayerRoot';

        capsule.collider = {
            radius,
            height,
        };

        capsule.tempBox = new THREE.Box3();
        capsule.tempSphere = new THREE.Sphere();
        capsule.tempSegment = new THREE.Line3();

        return capsule;
    }

    updateCapsuleCollision() {
        const { radius, height } = this.capsule.collider;

        // World position of the bottom and top points of the capsule
        const start = new THREE.Vector3(0, height, 0).applyMatrix4(this.capsule.matrixWorld);
        const end = new THREE.Vector3(0, -height, 0).applyMatrix4(this.capsule.matrixWorld);

        this.capsule.tempSegment.set(start, end);
        this.capsule.tempSphere.center.copy(start).lerp(end, 0.5);
        this.capsule.tempSphere.radius = 4;
        this.capsule.tempBox.setFromCenterAndSize(
            this.capsule.tempSphere.center,
            new THREE.Vector3(0.7, 1.0, 0.7)
        );


    }
}