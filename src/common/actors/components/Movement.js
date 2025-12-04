import MomentumBoost from "@solblade/client/actors/components/MomentumBoost";
import Pawn from "../Pawn";
import GroundChecker from "./GroundChecker";
import { RigidBody } from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";
import { projectOnPlane } from "@solblade/common/utils/Utils";

export class Movement {
    /**
     * 
     * @param {Pawn} pawn 
     */
    constructor(pawn, world) {
        this.pawn = pawn;
        /**@type {RigidBody} */
        this.body = pawn.body;
        this.world = world;
        this.momentum = new MomentumBoost();
        this.groundChecker = new GroundChecker(pawn)

        this.tempVec = new Vector3()
        this.tempVec1 = new Vector3()
        this.tempVec2 = new Vector3()

        this.speeds = {
            idle: {
                friction: 25,
            },
            ground: {
                friction: 15,
                accel: 15,
                max: 6,
            },
            air: {
                friction: 0.05,
                accel: 3,
                max: 4,
            },
            blade: {
                friction: 0,
                accel: 1,
                max: 7,
            }
        }
    }
    get velocity() {
        if (!this.body) return this.tempVec
        return this.tempVec.copy(this.body.linvel())
    }
    get latVel() {
        if (!this.body) return this.tempVec;
        const v = this.body.linvel();
        v.y = 0;
        return this.tempVec.copy(v);
    }
    get isGrounded() { return this.groundChecker.isGrounded() }
    set velocity(v) {
        if (!this.body) return;
        this.body.setLinvel(v, true);
    }
    update(dt) {
        this.momentum.update(dt, this.velocity);
    }
    smartMove(dt, dir) {
        if (this.groundChecker.isGrounded()) {
            if (dir) {
                this.groundMove(dt, dir);
            } else {
                this.idleMove(dt);
            }
        } else {
            this.airMove(dt, dir);
        }
    }
    idleMove(dt) {
        this.friction(dt, this.speeds.idle.friction);
    }
    groundMove(dt, wishdir) {
        this.friction(dt, this.speeds.ground.friction);
        if (!wishdir) return;
        const speed = this.speeds.ground.max + this.momentum.increaseBoost(dt)
        const floor = this.groundChecker.floorNormal();
        if (floor) {
            wishdir = projectOnPlane(wishdir, floor);
        }
        this.accelerate(dt, wishdir, speed, this.speeds.ground.accel);
    }
    airMove(dt, dir) {
        this.friction(dt, this.speeds.air.friction)
        if (!dir) return;
        this.accelerate(dt, dir, this.speeds.air.max, this.speeds.air.accel);
    }
    friction(dt, amnt, exponential = true) {
        const v = this.velocity;
        const speed = v.length();
        if (speed < 0.00001) return;
        const drop = exponential ? speed * amnt * dt : amnt * dt;
        const newSpeed = Math.max(0, (speed - drop));
        const scale = newSpeed / speed;
        v.x *= scale;
        v.y *= scale;
        v.z *= scale;
        this.velocity = v;
    }
    /**
     * @param {Vector3} wishdir 
     * */
    accelerate(dt, wishdir, wishspeed, accel, blend = 0.01) {
        if (!this.body) return;
        const dirspeed = this.latVel.dot(wishdir);
        const addSpeed = wishspeed - dirspeed;
        if (addSpeed <= 0) return false;
        const accelSpeed = Math.min(accel * addSpeed * dt, addSpeed);
        this.velocity = this.velocity.add(wishdir.multiplyScalar(accelSpeed));

        if (dirspeed > 0) {
            this.adjustVelocityDirection(wishdir, blend);
        }
    }
    adjustVelocityDirection(wishdir, blendFactor = 0.01) {
        this.tempVec1.copy(wishdir).normalize();
        if (wishdir.length() === 0) return;
        const v = this.velocity;
        const vy = v.y;
        const speed = Math.hypot(v.x, v.z);
        if (speed < 0.0001) return;

        this.tempVec1.multiplyScalar(speed);

        v.lerp(this.tempVec1, blendFactor);
        this.velocity = this.tempVec2.set(v.x, vy, v.z);
    }
}