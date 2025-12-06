import GroundChecker from "./GroundChecker";
import { RigidBody } from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";
import { projectOnPlane } from "@solblade/common/utils/Utils";
import { Momentum } from "./Momentum";
import Actor from "../Actor";

interface movementStateData {
    idle: movementData,
    ground: movementData,
    air: movementData,
    blade: movementData
}
interface movementData {
    friction: number,
    accel: number,
    max: number,
}

export class Movement {
    owner: Actor;
    body: RigidBody;
    momentum: Momentum;
    groundChecker: GroundChecker;
    tempVec: Vector3;
    tempVec1: Vector3;
    tempVec2: Vector3;
    speeds: movementStateData;
    _vecPos: Vector3;
    _quatRot: Quaternion;
    _vecVel: Vector3;
    _vecDir: Vector3;
    _yaw: number;
    upVec = new Vector3(0,1,0);
    constructor(owner) {
        this.owner = owner;
        /**@type {RigidBody} */
        this.body = owner.body;
        this.momentum = new Momentum();
        this.groundChecker = new GroundChecker(owner)

        this.tempVec = new Vector3()
        this.tempVec1 = new Vector3()
        this.tempVec2 = new Vector3()

        this.speeds = {
            idle: {
                friction: 25,
                accel: 0,
                max: 0,
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

    get vecPos() {
        if (!this._vecPos) this._vecPos = new Vector3();
        return this._vecPos.copy(this.body.translation());
    }
    set vecPos(v) {
        if (!this._vecPos) this._vecPos = new Vector3();
        this._vecPos.copy(v);
        this.owner.pos[0] = v.x;
        this.owner.pos[1] = v.y;
        this.owner.pos[2] = v.z;
    }
    get quatRot() {
        if (!this._quatRot) this._quatRot = new Quaternion();
        return this._quatRot.copy(this.body.rotation());
    }
    set quatRot(v) {
        if (!this._quatRot) this._quatRot = new Quaternion();
        this._quatRot.copy(v);
        this.owner.rot[0] = v.x;
        this.owner.rot[1] = v.y;
        this.owner.rot[2] = v.z;
        this.owner.rot[3] = v.w;
    }
    get yaw() { return this._yaw }
    set yaw(v) {
        this._yaw = v;
        this.quatRot = this.quatRot.setFromAxisAngle(this.upVec, v)
        console.log(this._yaw)

        if (!this.body) return;
        this.body.setRotation(this._quatRot, true);
    }
    get velocity() {
        if (!this._vecVel) this._vecVel = new Vector3();

        if (!this.body) return;
        return this._vecVel.copy(this.body.linvel());
    }
    set velocity(v) {
        if (!this._vecVel) this._vecVel = new Vector3();
        this._vecVel.copy(v);

        if (!this.body) return;
        this.body.setLinvel(this._vecVel, true);
    }
    set latVel(v) {
        if (!this._vecVel) this._vecVel = new Vector3();
        this._vecVel.copy(v);

        if (!this.body) return;
        const { x, y, z } = this.body.linvel();
        this.body.setLinvel({ x: v.x, y, z: v.z }, true);
    }
    get vecDir() {
        if (!this._vecDir) this._vecDir = new Vector3();

        return this._vecDir.applyQuaternion(this.body.rotation());
    }
    get latVel() {
        if (!this.body) return this.tempVec;
        const v = this.body.linvel();
        v.y = 0;
        return this.tempVec.copy(v);
    }
    get isGrounded() { return this.groundChecker.isGrounded() }
    update(dt) {
        this.momentum.update(dt, this.velocity);
    }
    smartMove(dt, dir = this.vecDir) {
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
    devFly(dir) {
        this.body.setTranslation(this.vecPos.add(dir), true);
        this.body.setLinvel(dir, true);
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