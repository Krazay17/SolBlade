import GroundChecker from "./GroundChecker";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import { projectOnPlane } from "@solblade/common/utils/Utils";
import { Momentum } from "./Momentum";
import { Actor } from "../Actor";
import SolWorld from "@solblade/common/core/SolWorld";

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
    turnSpeed: number = 1;

    private actor: Actor;
    private momentum: Momentum;
    private groundChecker: GroundChecker;
    private targetRot: Quaternion = new Quaternion();
    private tempVec: Vector3 = new Vector3();
    private tempVec1: Vector3 = new Vector3();
    private tempVec2: Vector3 = new Vector3();
    private tempQuat: Quaternion = new Quaternion();
    private tempEuler: Euler = new Euler();
    private tempMatrix: Matrix4 = new Matrix4();
    private speeds: movementStateData;
    private _vecPos: Vector3;
    private _quatRot: Quaternion;
    private _vecVel: Vector3;
    private _vecDir: Vector3;
    private _yaw: number;
    private upVec = new Vector3(0, 1, 0);
    constructor(actor: Actor) {
        this.actor = actor;
        this.momentum = new Momentum();
        this.groundChecker = new GroundChecker(this, .5);

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
        if (!this.actor.body) return this._vecPos;
        return this._vecPos.copy(this.actor.body.translation());
    }
    set vecPos(v) {
        if (!this._vecPos) this._vecPos = new Vector3();
        this._vecPos.copy(v);
        this.actor.pos[0] = v.x;
        this.actor.pos[1] = v.y;
        this.actor.pos[2] = v.z;
    }
    get quatRot() {
        if (!this._quatRot) this._quatRot = new Quaternion();
        if (!this.actor.body) return this._quatRot;
        return this._quatRot.copy(this.actor.body.rotation());
    }
    set quatRot(v) {
        if (!this._quatRot) this._quatRot = new Quaternion();
        this._quatRot.copy(v);
        this.actor.rot[0] = v.x;
        this.actor.rot[1] = v.y;
        this.actor.rot[2] = v.z;
        this.actor.rot[3] = v.w;
    }
    get yaw() { return this._yaw }
    set yaw(v) {
        this._yaw = v;
        this.quatRot = this.quatRot.setFromAxisAngle(this.upVec, v)

        if (!this.actor.body) return;
        this.actor.body.setRotation(this._quatRot, true);
    }
    get velocity() {
        if (!this._vecVel) this._vecVel = new Vector3();

        if (!this.actor.body) return this._vecVel;
        return this._vecVel.copy(this.actor.body.linvel());
    }
    set velocity(v) {
        if (!this._vecVel) this._vecVel = new Vector3();
        this._vecVel.copy(v);

        if (!this.actor.body) return;
        this.actor.body.setLinvel(this._vecVel, true);
    }
    get vY() { return this.velocity.y }
    set vY(a) {
        const v = this.velocity;
        this.velocity = this.velocity.set(v.x, a, v.z);
    }
    set latVel(v) {
        if (!this._vecVel) this._vecVel = new Vector3();
        this._vecVel.copy(v);

        if (!this.actor.body) return;
        const { x, y, z } = this.actor.body.linvel();
        this.actor.body.setLinvel({ x: v.x, y, z: v.z }, true);
    }
    get vecDir() {
        if (!this._vecDir) this._vecDir = new Vector3();
        if (!this.actor.body) return this._vecDir;
        return this._vecDir.applyQuaternion(this.actor.body.rotation());
    }
    get latVel() {
        const v = this.velocity;
        v.y = 0;
        return this.tempVec.copy(v);
    }
    get isGrounded() {
        return this.groundChecker.isGrounded()
    }
    update(dt) {
        this.momentum.update(dt, this.velocity);
    }
    smartMove(dt, dir) {
        if (!dir) return;
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
    turnTo(dt: number, dir) {
        if (!this.actor.body) return;
        const rot = this.tempQuat.copy(this.actor.body.rotation());

        if (dir instanceof Quaternion) {
            this.targetRot.copy(dir);
        } else if (dir instanceof Vector3) {
            this.tempMatrix.lookAt(
                this.tempVec.set(0, 0, 0),
                dir,
                this.upVec,
            )
            this.targetRot.setFromRotationMatrix(this.tempMatrix);
        }
        // --- Yaw Filtering (Crucial Step) ---

        // The targetRot now contains the full 3D rotation (yaw, pitch, roll) needed 
        // to face 'dir'. We need to remove the pitch and roll.

        // 1. Apply the target rotation to a temporary Vector3 that starts facing +Z
        const filteredDir = this.tempVec.set(0, 0, 1).applyQuaternion(this.targetRot);

        // 2. ZERO OUT the Y component (height) of the resulting vector.
        // This forces the direction vector to exist purely on the X-Z (ground) plane.
        filteredDir.y = 0;

        // 3. Re-normalize the vector
        filteredDir.normalize();

        // 4. Calculate the FINAL Yaw-Only Target Quaternion from the filtered X-Z vector
        // This creates a quaternion that only rotates around the Y axis.
        this.targetRot.setFromUnitVectors(
            this.tempVec1.set(0, 0, -1), // The initial direction (forward)
            filteredDir // The desired ground-plane direction
        );
        rot.slerp(this.targetRot, dt * 60);
        this.actor.body.setRotation(rot, true);
    }
    airMove(dt, dir) {
        this.friction(dt, this.speeds.air.friction)
        if (!dir) return;
        this.accelerate(dt, dir, this.speeds.air.max, this.speeds.air.accel);
    }
    idleMove(dt) {
        this.friction(dt, this.speeds.idle.friction);
    }
    devFly(dir) {
        this.actor.body.setTranslation(this.vecPos.add(dir), true);
        this.actor.body.setLinvel(dir, true);
    }
    jumpStart() {
        this.vY += 12;
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
    accelerate(dt, wishdir, wishspeed, accel, blend = 0.01) {
        if (!this.actor.body) return;
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