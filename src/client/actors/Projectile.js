import * as THREE from 'three';
import Actor from './Actor';
import MeshManager from '../core/MeshManager';
import HitData from '../core/HitData';
import RAPIER from '@dimforge/rapier3d-compat';

export default class Projectile extends Actor {
    constructor(game, data) {
        super(game, data);
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

        if (!this.isRemote) {
            this.createBody();
        }
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
        const texture = await this.meshManager.getTex('dirtMask.webp');
        this.material.map = texture;
        this.material.needsUpdate = true;
        this.texture = texture;
    }
    createBody() {
        this.body = new RAPIER.Ball(this.radius);
        this.bodyRot = new RAPIER.Quaternion(1, 0, 0, 0);

    }
    update(deltaTime) {
        if (!this.active) return;

        this.tempVector.copy(this.velocity).multiplyScalar(deltaTime);
        if (this.gravity) {
            this.velocity.y -= this.gravity * deltaTime; // Apply gravity
        }
        this.position.add(this.tempVector);


        if (this.spawnTime + this.duration < performance.now()) {
            this.die();
        }

        if (this.isRemote) return;
        if(!this.body) return;

        const result = this.game.physicsWorld.intersectionWithShape(
            this.position,
            this.bodyRot,
            this.body,
            undefined,
            undefined,
            undefined,
            this.owner.body.body
        )
        if (result) {
            const target = result.actor
            if (target) {
                target.hit(new HitData({
                    dealer: this.owner,
                    target,
                    amount: this.damage,
                }))
            }
            this.die();
        }
    }
    setGravity(amount) {
        this.gravity = amount;
    }
}
