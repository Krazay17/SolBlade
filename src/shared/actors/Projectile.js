import { Vector3 } from "three";
import Actor from "./Actor.js";
import RAPIER from "@dimforge/rapier3d-compat";

export default class Projectile extends Actor {
    constructor(physics, data = {}) {
        super({ ...data, lifetime: data.lifetime ?? 10000 });
        const {
            radius = 1,
            speed = 1,
            gravity = 5,
            ignoreBody = null,
            damage = 1,
            hitCallback = null,
            collideCallback = null,
        } = data;
        this.data = { ...data };

        /**@type {RAPIER.World} */
        this.physics = physics;
        this.radius = radius;
        this.speed = speed;
        this.gravity = gravity;
        this.ignoreBody = ignoreBody;

        this.tempVec = new Vector3();
        this.veloctiy = this.dir.clone().multiplyScalar(this.speed);

        this.body = new RAPIER.Ball(this.radius);

        this.damage = damage;

        this.hitCallback = hitCallback;
        this.collideCallback = collideCallback;
    }
    fixedUpdate(dt, time) {
        if (!this.active) return;
        this.age = performance.now() - this.timestamp;
        if (this.lifetime) {
            if (this.age >= this.lifetime) this.destroy();
        }

        if (this.gravity) this.veloctiy.y -= this.gravity * dt;
        this.tempVec.copy(this.veloctiy).multiplyScalar(dt);

        this.pos.add(this.tempVec);

        if (!this.body) return;
        if (this.isRemote) return;

        const result = this.physics.intersectionWithShape(
            this.pos,
            this.rot,
            this.body,
            undefined,
            undefined,
            undefined,
            this.ignoreBody,
        )

        if (result) {
            const target = result.actor;
            if (target) {
                if (target === this.owner) return;
                if (this.hitCallback) this.hitCallback(result);
                this.onHit(result);
            }
            if (this.collideCallback) this.collideCallback(result);
            this.onCollide(result);
        }
    }
    onCollide(result) { }
    onHit(result) { }
}