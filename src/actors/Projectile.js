import * as THREE from 'three';
import Globals from '../utils/Globals';

export default class Projectile extends THREE.Object3D {
    constructor(position, direction, speed, lifetime, params = {}) {
        super();
        this.init(position, direction, speed, lifetime, params);
        this.tempVector = new THREE.Vector3();

        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.666, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        this.add(this.mesh);
        Globals.scene.addTickable(this);
        this.active = true;
    }

    init(position, direction, speed, lifetime) {
        this.position.set(position.x, position.y, position.z);
        this.rotation.set(direction.x, direction.y, direction.z);
        this.scale.set(1, 1, 1);
        this.velocity = new THREE.Vector3(
            direction.x * speed,
            direction.y * speed,
            direction.z * speed
        );
        this.lifetime = lifetime || 10000; // Default lifetime
    }

    update(deltaTime) {
        if(!this.active) return;
        // Update the position of the projectile based on its velocity
        this.tempVector.copy(this.velocity).multiplyScalar(deltaTime);
        this.position.add(this.tempVector);
        this.lifetime -= deltaTime * 1000;

        for (const enemy of Globals.enemyActors) {
            if (this.position.distanceToSquared(enemy.position) < 1) {
                enemy.takeDamage(Globals.player, { amount: 10 });
                this.destroy();
                console.log('hit enemy');
                break;
            }
        }

        if (this.lifetime <= 0) {
            this.destroy();
        }
    }

    destroy() {
        this.active = false;
        if (this.parent) {
            this.parent.remove(this);
        }
        if (this.mesh) {
            this.mesh.visible = false;
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
}
