import * as THREE from 'three';
import Actor from './Actor';
import MeshManager from '../core/MeshManager';
import HitData from '../core/HitData';

export default class Projectile extends Actor {
    constructor(scene, data) {
        super(scene, data);
        const {
            dir = new THREE.Vector3(0, 0, 1),
            speed = 1,
            dur = 10000,
            scale = { x: 1, y: 1, z: 1 },
            radius = 1,
            damage = 25,
        } = data;

        this.direction = dir;
        this.velocity = new THREE.Vector3(
            dir.x * speed,
            dir.y * speed,
            dir.z * speed
        );
        this.duration = dur;
        this.scale.set(scale.x, scale.y, scale.z);
        this.radius = radius;
        this.damage = damage;

        this.meshManager = MeshManager.getInstance();
        this.mesh = null;
        this.material = null;
        this.texture = null;

        this.tempVector = new THREE.Vector3();
        this.tempVector2 = new THREE.Vector3();
        this.tempVector3 = new THREE.Vector3();
        this.headOffset = new THREE.Vector3(0, 0, 0);
        this.footOffset = new THREE.Vector3(0, 0, 0);
        this.gravity = 0; // Whether the projectile is affected by gravity

        this.targetPosition.copy(this.position)
        this.createBody();
    }
    createMesh() {
        const geom = new THREE.SphereGeometry(this.radius, 16, 16);
        const material = new THREE.MeshLambertMaterial({
            emissive: 0xff0000,
            emissiveIntensity: 1,
            transparent: true,
            opacity: .9,
        });
        this.mesh = new THREE.Mesh(
            geom,
            material,
        );
        this.add(this.mesh);
        this.material = material
        this.applyTexture();
    }
    async applyTexture() {
        const texture = await this.meshManager.getTex('SkyFilter2.webp');
        this.material.map = texture;
        this.material.needsUpdate = true;
        this.texture = texture;
    }
    createBody() {
        this.body = new THREE.Sphere(new THREE.Vector3(), this.radius / 2);
    }
    update(deltaTime) {
        if (!this.active) return;

        this.tempVector.copy(this.velocity).multiplyScalar(deltaTime);
        if (this.gravity) {
            this.velocity.y -= this.gravity * deltaTime; // Apply gravity
        }
        this.position.add(this.tempVector);

        if (this.isRemote) return;
        const activeActors = this.scene.actorManager.getActiveActors(this, this.owner);
        for (const enemy of activeActors) {
            if (enemy.height) {
                this.headOffset.set(0, enemy.height * 0.5, 0);
                this.footOffset.set(0, enemy.height * -0.5, 0);
            } else {
                this.headOffset.set(0, 0, 0);
                this.footOffset.set(0, 0, 0);
            }
            const enemyHead = this.tempVector2.copy(enemy.position).add(this.headOffset);
            const enemyFoot = this.tempVector3.copy(enemy.position).add(this.footOffset);
            if (this.position.distanceToSquared(enemyHead) < this.radius ||
                this.position.distanceToSquared(enemyFoot) < this.radius) {
                const hitData = new HitData({
                    dealer: this.owner,
                    target: enemy,
                    hitPosition: this.position,
                    amount: this.damage,
                    type: 'fire',
                })
                enemy.hit(hitData);

                this.die();
                return;
            }
        }
        const walls = this.game.levelLOS;
        if (walls) {
            this.body.center.copy(this.position);
            if (walls.geometry.boundsTree.intersectsSphere(this.body)) {
                this.die();
            }
        }
        this.duration -= deltaTime * 1000;
        if (this.duration <= 0) {
            this.die();
        }
    }
    setGravity(amount) {
        this.gravity = amount;
    }
}
