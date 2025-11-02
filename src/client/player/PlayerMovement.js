import LocalData from "../core/LocalData";
import { projectOnPlane, clampVector } from "../utils/Utils";
import RunBoost from "./MomentumBoost";
import GroundChecker from "./GroundChecker";
import { Vector3 } from "three";
import Input from "../core/Input";

export default class PlayerMovement {
    /**
     * @param {import('./Player').default} actor
     */
    constructor(game, actor) {
        this.game = game
        this.actor = actor;
        this.body = actor.body;
        this.input = actor.input;

        this.momentumBooster = new RunBoost(actor);
        this.groundChecker = new GroundChecker(this.game, actor);
        this.grounded = false;

        // Reusable vectors
        this.direction = new Vector3();
        this.tempVector = new Vector3();
        this.tempVector2 = new Vector3();
        this.dashValue = 0;

        this.defaultValues = {
            idle: {
                friction: 25,
            },
            ground: {
                friction: 20,
                accel: 20,
                speed: 6,
                tap: 0.01
            },
            air: {
                friction: 0,
                accel: 2,
                speed: 4,
                tap: 0.01
            },
            blade: {
                friction: 0,
                accel: 1,
                speed: 7,
                tap: 0.01
            },
            attack: {
                friction: 2,
                accel: 10,
                speed: 3,
                tap: 0.01
            },
            dash: {
                speed: 10
            }
        }

        const savedValues = LocalData.movementValues;
        this.values = savedValues ?? this.defaultValues

        window.addEventListener('beforeunload', () => {
            LocalData.movementValues = this.values;
            LocalData.save();
        });
    }

    update(dt) {
        this.momentumBooster.update(dt, this.body.velocity);
    }
    jumpBuffer(slope = 0.3) {
        if (!this.isGrounded(slope)) {
            if (!this.floorTimer) {
                this.floorTimer = setTimeout(() => {
                    this.floorTimer = null;
                    this.grounded = false;
                }, 150);
            }
        } else {
            clearTimeout(this.floorTimer);
            this.floorTimer = null;
            if (!this.grounded) {
                // do once on land
            }
            this.grounded = true;
        }
    }

    isGrounded(slopeLimit = 0.7) {
        return this.groundChecker.isGrounded(slopeLimit);
    }
    floorTrace() {
        return this.groundChecker.floorTrace();
    }
    fallStart() {
        clearTimeout(this.floorTimer);
        this.floorTimer = setTimeout(() => {
            this.floorTimer = null;
            this.grounded = false;
        }, 150);
    }

    resetDefaultValues() {
        this.values = this.defaultValues;
        return this.values;
    }

    idleMove(dt) {
        this.applyFriction(dt, this.values.idle.friction, false);
        if (this.body.velocity.length() < 1) {
            return false;
        }
        return true;
    }
    smartMove(dt) {
        if (this.isGrounded()) {
            this.groundMove(dt);
        } else {
            this.airMove(dt);
        }
    }

    dashForward(speed = 7, restrictY = true, noY = false) {
        const forward = this.actor.getShootData().dir;
        if (restrictY) forward.y = Math.min(0, forward.y);
        if (noY) forward.y = 0;
        forward.normalize();
        this.body.velocity = forward.multiplyScalar(speed);
    }

    hoverFreeze(dt, lateralDampening = .98) {
        const scaledDelta = dt * 120;
        const x = this.body.velocity.x *= lateralDampening ** scaledDelta;
        const z = this.body.velocity.z *= lateralDampening ** scaledDelta;
        const y = this.body.velocity.y < 0 ? this.body.velocity.y *= .9 ** scaledDelta : this.body.velocity.y *= .999 ** scaledDelta;
        this.body.velocity = { x, y, z };
    }
    slowMove(dt, friction = 5, speed = 2, accel = 2) {
        this.applyFriction(dt, friction);
        const wishdir = this.getInputDirection();
        this.accelerate(wishdir, speed, accel);
    }
    attackMove(dt, friction = null, speed = null) {
        const wishdir = this.getInputDirection();

        this.applyFriction(dt, friction ?? this.values.attack.friction);
        this.body.velocity.y *= .9975;
        this.accelerate(wishdir, speed ?? this.values.attack.speed, this.values.attack.accel, dt, this.values.attack.tap);
    }

    groundMove(dt) {
        this.applyFriction(dt, this.values.ground.friction);

        let wishdir = this.getInputDirection();
        let wishspeed = this.values.ground.speed + this.momentumBooster.increaseBoost(dt);
        if (wishdir.length() === 0) return;
        const floorNormal = this.groundChecker.floorNormal();
        if (floorNormal) {
            wishdir = projectOnPlane(wishdir, floorNormal);
        }

        this.accelerate(wishdir, wishspeed, this.values.ground.accel, dt, this.values.ground.tap);
        //this.clampHorizontalSpeed(wishspeed, .02);
    }

    airMove(dt) {
        this.applyFriction(dt, this.values.air.friction);

        const wishdir = this.getInputDirection();
        if (wishdir.length() === 0) return;

        this.accelerate(wishdir, this.values.air.speed, this.values.air.accel, dt, this.values.air.tap);
    }

    bladeStart(pwr = 1) {
        const v = this.tempVec2.copy(this.body.velocity)
        const vN = this.tempVec3.copy(v.clone())
        vN.normalize();
        const n = this.groundChecker.floorNormal();
        if (!n) return;
        const vdot = v.dot(n);
        let boost = 1 + ((1 - this.upDir.dot(n)) * (1 - Math.abs(vN.dot(n))));
        this.momentumBooster.increaseBoost(boost);
        let projectV = v.vsub(n.scale(vdot));
        projectV.scale(boost, projectV);
        const maxBoost = 25;
        if (projectV.length() > maxBoost) {
            projectV.normalize();
            projectV.scale(maxBoost, projectV);
        }
        this.body.velocity.copy(projectV);
    }

    bladeMove(dt) {
        this.applyFriction(dt, this.values.blade.friction, false);

        let wishdir = this.getInputDirection();
        let wishspeed = this.values.blade.speed + this.momentumBooster.increaseBoost(dt);
        if (wishdir.length() === 0) return;

        const floorNorm = this.groundChecker.floorNormal(.1);
        if (floorNorm) {
            wishdir = projectOnPlane(wishdir, floorNorm);
        }
        this.accelerate(
            wishdir,
            wishspeed,
            this.values.blade.accel,
            dt,
            this.values.blade.tap
        );
    }
    dashStart() {
        this.getInputDirection(-1);
        this.dashValue = Math.max(this.values.dash.speed, this.body.velocity.length());
    }
    dashMove(dt, decay = 10, min = 6) {
        const d = this.tempVector.copy(this.direction)
        this.dashValue = Math.max(min, this.dashValue - decay * dt);
        this.body.velocity = d.multiplyScalar(this.dashValue);
    }
    dashStop() {
        const currentVel = this.body.velocity.clone();
        this.body.velocity = clampVector(currentVel, 12);
    }

    jumpStart(addJump = 4, maxJump = 8) {
        const v = this.body.velocity;
        const yv = Math.min(maxJump, Math.max(addJump, v.y + addJump))
        this.body.velocity = { x: v.x, y: yv, z: v.z };
    }

    jumpMove(dt, height = 8) {
        this.airMove(dt);
        const v = this.body.velocity;

        this.body.velocity = { x: v.x, y: v.y += height * dt, z: v.z };
    }

    applyFriction(dt, friction, expo = true) {
        const v = this.body.velocity;
        const speed = v.length();
        if (speed < 0.00001) return;
        const drop = expo ? speed * friction * dt : friction * dt;
        const newSpeed = Math.max(0, (speed - drop));
        const scale = newSpeed / speed;
        v.x *= scale;
        v.y *= scale;
        v.z *= scale;
        this.body.velocity = v;
    }
    /**@param {Vector3} wishdir */
    accelerate(wishdir, wishspeed, accel, dt, blendFactor = 0.01) {
        const v = this.body.velocity;
        const currentVelocity = this.tempVector.copy(this.body.velocity);
        currentVelocity.y = 0;

        const wishDirSpeed = currentVelocity.dot(wishdir);
        const addSpeed = (wishspeed - wishDirSpeed);

        if (addSpeed <= 0) return false;
        const accelSpeed = Math.min(accel * addSpeed * dt, addSpeed);
        v.add(wishdir.multiplyScalar(accelSpeed));
        this.body.velocity = v;

        if (wishDirSpeed > 0) {
            this.adjustVelocityDirection(wishdir, blendFactor);
        }
    }
    adjustVelocityDirection(wishdir, blendFactor = 0.01) {
        this.tempVector.copy(wishdir).normalize();
        if (wishdir.length() === 0) return;

        const v = this.body.velocity;
        const vy = v.y;
        v.y = 0;
        const speed = Math.hypot(v.x, v.z);
        if (speed < 0.0001) return;
        const vXZ = this.tempVector2.copy(v);
        vXZ.y = 0;

        this.tempVector.multiplyScalar(speed);

        v.lerp(this.tempVector, blendFactor);

        this.body.velocity = { x: v.x, y: vy, z: v.z };
    }
    clampHorizontalSpeed(maxSpeed) {
        const v = this.body.velocity;
        const horizSpeed = Math.hypot(v.x, v.z);
        if (horizSpeed > maxSpeed) {
            const scale = maxSpeed / horizSpeed;
            this.body.velocity = { x: v.x *= scale, y: v.y, z: v.z *= scale }
        }
    }
    getInputDirection(z = 0) {
        this.direction.set(0, 0, 0);

        /**@type {Input} */
        const input = this.input

        // Gather input directions
        if (input.actionStates.moveForward) this.direction.z -= 1;
        if (input.actionStates.moveBackward) this.direction.z += 1;
        if (input.actionStates.moveLeft) this.direction.x -= 1;
        if (input.actionStates.moveRight) this.direction.x += 1;

        if (this.direction.length() === 0) {
            this.direction.z = z;
        }
        const { rotatedX, rotatedZ } = this.rotateInputVector(this.direction);

        // Input direction as a vector
        this.direction.set(rotatedX, 0, rotatedZ);
        this.direction.normalize();
        return this.direction;
    }

    rotateInputVector(dir) {
        // Rotate input direction by controller yaw
        const yaw = this.input.yaw;
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);

        const rotatedX = dir.x * cosYaw + dir.z * sinYaw;
        const rotatedZ = -dir.x * sinYaw + dir.z * cosYaw;

        return { rotatedX, rotatedZ };
    }
}