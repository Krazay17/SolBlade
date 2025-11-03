import { Vector3 } from "three";
import Actor from "./Actor";
import RAPIER from "@dimforge/rapier3d-compat";
import HitData from "./HitData"

export default class Projectile extends Actor {
    constructor(physics, data = {}) {
        super(data);
        const {
            radius = 1,
            speed = 1,
            gravity = 5,
            dir = new Vector3(),
            lifetime = 10,
            ignoreBody = null,
            damage = 1,
            damageType = 'normal',
            hitCallback = null,
        } = data;

        /**@type {RAPIER.World} */
        this.physics = physics;
        this.type = 'projectile';
        this.radius = radius;
        this.speed = speed;
        this.gravity = gravity;
        /**@type {Vector3} */
        this.dir = dir;
        this.lifetime = lifetime;
        this.ignoreBody = ignoreBody;
        this.age = 0;

        this.damage = damage;
        this.damageType = damageType;


        this.hitData = new HitData({
            dealer: this.owner,
            type: this.damageType,
            amount: this.damage,
        })

        this.veloctiy = this.dir.multiplyScalar(this.speed);
        this.tempVec = new Vector3();

        this.body = new RAPIER.Ball(this.radius);

        this.onHit = hitCallback;
    }
    fixedUpdate(dt, time) {
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
            if (target && target !== this.owner && !this.hasHit) {
                this.hasHit = true;
                this.hitData.target = target;
                this.hitData.hitPosition = this.pos;
                target.hit?.(this.hitData);
            }
        }
    }
}