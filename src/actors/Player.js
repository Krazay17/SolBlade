import * as THREE from 'three';
import Input from '../core/Input';

export default class Player {
    constructor(x, y, z, scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({
                color: 0xffff00,
                roughness: 0.5, // matte vs shiny
                metalness: 0.3  // metallic look
            })
        );
        this.mesh.position.set(x, y, z);
        this.mesh.castShadow = true;

        Input.init();

        this.camDirection = new THREE.Vector3();
        this.speed = 5;
    }

    update(dt) {
        let forward = 0;
        let strafe = 0;

        if (Input.keys['KeyW']) forward += this.speed;
        if (Input.keys['KeyS']) forward -= this.speed;
        if (Input.keys['KeyA']) strafe -= this.speed;
        if (Input.keys['KeyD']) strafe += this.speed;

        if (forward !== 0 || strafe !== 0) {
            this.mesh.position.add(this.movementDirection(dt, forward, strafe));
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