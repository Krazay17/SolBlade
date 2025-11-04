import { Vector3 } from "three";
import Actor from "./Actor.js";
import RAPIER from "@dimforge/rapier3d-compat";
import HitData from "../HitData.js"

export default class Projectile extends Actor {
    constructor(physics, data = {}) {
        super(data);
        const {
            radius = 1,
            speed = 1,
            gravity = 5,
            lifetime = 10000,
            ignoreBody = null,
            damage = 1,
            damageType = 'normal',
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

        this.timestamp = performance.now();
        this.lifetime = lifetime;
        this.age = 0;

        this.damage = damage;
        this.damageType = damageType;

        this.hitData = new HitData({
            dealer: this.owner,
            type: this.damageType,
            amount: this.damage,
        })

        this.tempVec = new Vector3();
        this.veloctiy = this.dir.clone().multiplyScalar(this.speed);

        this.body = new RAPIER.Ball(this.radius);

        this.hitCallback = hitCallback;
        this.collideCallback = collideCallback;
    }
    fixedUpdate(dt, time) {
        if (!this.active) return;
        this.age = performance.now() - this.timestamp;
        if (this.age >= this.lifetime) this.destroy();

        this.tempVec.copy(this.veloctiy).multiplyScalar(dt);
        if (this.gravity) this.tempVec.y -= this.gravity * dt;

        this.pos.add(this.tempVec);

        if (!this.body) return;
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
                this.hitData.target = target;
                this.hitData.hitPosition = this.pos;
                //target.hit?.(this.hitData);
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