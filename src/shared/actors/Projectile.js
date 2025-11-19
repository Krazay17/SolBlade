import { Vector3, Quaternion } from "three";
import Actor from "./Actor.js";
import RAPIER from "@dimforge/rapier3d-compat";
import { COLLISION_GROUPS } from "../SolConstants.js";

export default class Projectile extends Actor {
    constructor(physics, data = {}) {
        const posArr = data.pos;
        const dirArr = data.dir;
        const rotArr = data.rot;

        const pos = Array.isArray(posArr)
            ? new Vector3(posArr[0] || 0, posArr[1] || 0, posArr[2] || 0)
            : new Vector3(posArr?.x || 0, posArr?.y || 0, posArr?.z || 0);

        const dir = Array.isArray(dirArr)
            ? new Vector3(dirArr[0] || 0, dirArr[1] || 0, dirArr[2] || 0)
            : new Vector3(dirArr?.x || 0, dirArr?.y || 0, dirArr?.z || 0);

        const rot = Array.isArray(rotArr)
            ? new Quaternion(rotArr[0] || 0, rotArr[1] || 0, rotArr[2] || 0, rotArr[3] || 1)
            : new Quaternion(rotArr?.x || 0, rotArr?.y || 0, rotArr?.z || 0, rotArr?.w || 1);
        super({ ...data, pos, dir, rot, lifetime: data.lifetime ?? 10000 });
        const {
            radius = 1,
            speed = 1,
            gravity = 5,
            ignoreBody = null,
            ignoreCol = null,
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
        this.ignoreCol = ignoreCol;
        this.noCollide = false;
        this.colFilter = null; //(COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.WORLD) << 16 | COLLISION_GROUPS.PLAYER;

        this.tempVec = new Vector3();
        if (this.dir.x === 0 && this.dir.y === 0 && this.dir.z === 0) {
            const q = quatForward(this.rot);
            this.veloctiy = new Vector3(q.x, q.y, q.z);
            this.veloctiy.multiplyScalar(this.speed);
        } else {
            this.veloctiy = this.dir.clone().multiplyScalar(this.speed);
        }

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
        if (this.noCollide) return;

        // const result = this.physics.intersectionWithShape(
        //     this.pos,
        //     this.rot,
        //     this.body,
        //     undefined,
        //     undefined,
        //     undefined,
        //     this.ignoreBody,
        // )
        this.physics.intersectionsWithShape(
            this.pos,
            this.rot,
            this.body,
            (c) => this.collide(c),
            undefined,
            this.colFilter,
            this.ignoreCol,
            this.ignoreBody,
        )

        // if (result) {
        //     const target = result.actor;
        //     if (target) {
        //         if (target === this.owner) return;
        //         if (this.hitCallback) this.hitCallback(target);
        //         this.onHit(target);
        //     }
        //     if (this.collideCallback) this.collideCallback(result);
        //     this.onCollide(result);
        // }
    }
    collide(c) {
        if (c) {
            const target = c.actor;
            if (target) {
                if (target === this.owner) return;
                console.log(target);
                if (this.hitCallback) this.hitCallback(target);
                this.onHit(target);
            }
            if (this.collideCallback) this.collideCallback(c);
            this.onCollide(c);
        }
    }
    onCollide(result) {
        this.noCollide = true;
    }
    onHit(result) { }
}

function quatForwardArray(q) {
    return [
        2 * (q.x * q.z + q.w * q.y),
        2 * (q.y * q.z - q.w * q.x),
        1 - 2 * (q.x * q.x + q.y * q.y),
    ];
}
function quatForward(q) {
    return {
        x: 2 * (q.x * q.z + q.w * q.y),
        y: 2 * (q.y * q.z - q.w * q.x),
        z: 1 - 2 * (q.x * q.x + q.y * q.y),
    };
}
