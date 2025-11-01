import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import Actor from './Actor.js';
import HitData from './HitData.js';

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

        this.tempVector = new THREE.Vector3();
        this.gravity = 0; // Whether the projectile is affected by gravity

        this.body = new RAPIER.Ball(this.radius / 2);
        this.bodyRot = new RAPIER.Quaternion(1, 0, 0, 0);
    }
    update(deltaTime) {
        if (!this.active) return;

        this.tempVector.copy(this.velocity).multiplyScalar(deltaTime);
        if (this.gravity) {
            this.velocity.y -= this.gravity * deltaTime; // Apply gravity
        }
        this.position.add(this.tempVector);
        if (this.isRemote) return;
        return;
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
                    damage: 50,
                }))
            }
            this.die();
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
