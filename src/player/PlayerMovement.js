import { Vec3 } from "cannon";
import LocalData from "../core/LocalData";

export default class PlayerMovement {
    constructor(actor) {
        this.actor = actor;
        this.body = actor.body;
        this.input = actor.input;

        this.direction = new Vec3();
        this.tempVec = new Vec3();
        this.tempVec2 = new Vec3();
        this.dashValue = 0;

        const savedValues = LocalData.movementValues;
        console.log(savedValues);
        this.values = savedValues ?? {
            ground: {
                friction: 12,
                accel: 10,
                speed: 10,
                tap: .2
            },
            air: {
                friction: 0,
                accel: 2.5,
                speed: 4,
                tap: .01
            },
            blade: {
                friction: 0.1,
                accel: 1,
                speed: 10,
                tap: .01
            },
            idle: {
                friction: 14,
                accel: 10,
                speed: 10,
                tap: .01
            },
            attack: {
                friction: 3,
                accel: 1,
                speed: 1,
                tap: .01
            },
            dash: {
                speed: 25
            }
        }
        window.addEventListener('beforeunload', () => {
            LocalData.movementValues = this.values;
            LocalData.save();
        });
    }

    idleMove(dt) {
        this.applyFriction(dt, this.values.idle.friction);
    }

    attackMove(dt) {
        this.applyFriction(dt, this.values.attack.friction);
        this.body.velocity.y *= .98;
        const wishdir = this.getInputDirection();
        this.accelerate(wishdir, this.values.attack.speed, this.values.attack.accel, dt, this.values.attack.tap);
    }

    groundMove(dt) {
        this.applyFriction(dt, this.values.ground.friction);
        // 1. Friction
        this.applyFriction(dt, this.values.ground.friction);

        // 2. Get input direction
        const wishdir = this.getInputDirection(); // normalized Vector3 (x,z)
        if (wishdir.almostZero()) return;

        // 3. Accelerate
        this.accelerate(wishdir, this.values.ground.speed, this.values.ground.accel, dt, this.values.ground.tap);
    }

    airMove(dt) {
        this.applyFriction(dt, this.values.air.friction);

        const wishdir = this.getInputDirection();
        if (wishdir.almostZero()) return;

        this.accelerate(wishdir, this.values.air.speed, this.values.air.accel, dt, this.values.air.tap);
    }

    bladeEnter() {
        this.slopeBoost(this.body.velocity.length());
    }

    bladeMove(dt) {
        this.applyFriction(dt, this.values.blade.friction);

        const wishdir = this.getInputDirection();
        if (wishdir.almostZero()) return;

        this.accelerate(wishdir, this.values.blade.speed, this.values.blade.accel, dt, this.values.blade.tap);

        this.slopeBoost(5 * dt);
    }

    slopeBoost(amnt) {
        this.tempVec.copy(this.actor.groundChecker.floorNormal());
        this.tempVec.cross(this.tempVec2.set(0, 1, 0), this.tempVec);
        this.actor.groundChecker.floorNormal().cross(this.tempVec, this.tempVec);
        this.body.velocity.vadd(this.tempVec.scale(amnt), this.body.velocity);
    }

    dashStart() {
        this.getInputDirection(-1);
        this.dashValue = this.values.dash.speed;
    }
    dashMove(dt) {
        this.dashValue -= 60 * dt;
        const dashVelocity = this.direction.scale(this.dashValue);
        this.body.velocity.copy(dashVelocity);
    }
    dashStop() {
        const currentVel = this.body.velocity.clone();
        currentVel.mult(0.4, this.body.velocity);
    }

    jumpStart() {
        if (this.body.velocity.y < 0) {
            this.body.velocity.y = 9.8;
        } else {
            this.body.velocity.y += 9.8;
        }
    }

    applyFriction(dt, friction) {
        const speed = Math.hypot(this.body.velocity.x, this.body.velocity.z);
        if (speed < 0.0001) return;

        const drop = speed * friction * dt;
        const newSpeed = Math.max(speed - drop, 0);

        const scale = newSpeed / speed;
        this.body.velocity.x *= scale;
        this.body.velocity.z *= scale;
    }

    accelerate(wishdir, wishspeed, accel, dt, tapBlend) {
        const scaledWishSpeed = wishspeed + this.actor.runBooster.getBoost();
        const currentVelocity = this.body.velocity.clone(); // speed in that direction
        currentVelocity.y = 0;
        const currentHorizSpeed = currentVelocity.dot(wishdir);

        const addSpeed = (scaledWishSpeed - currentHorizSpeed);
        if (addSpeed <= 0) return;

        this.tapStrafe(wishdir, tapBlend);

        const accelSpeed = Math.min(accel * scaledWishSpeed * dt, addSpeed);
        this.body.velocity.x += wishdir.x * accelSpeed;
        this.body.velocity.z += wishdir.z * accelSpeed;
    }

    getInputDirection(z = 0) {
        this.direction.set(0, 0, 0);

        // Gather input directions
        if (this.input.keys['KeyW']) this.direction.z -= 1;
        if (this.input.keys['KeyS']) this.direction.z += 1;
        if (this.input.keys['KeyA']) this.direction.x -= 1;
        if (this.input.keys['KeyD']) this.direction.x += 1;

        if (this.direction.length() === 0) {
            this.direction.z = z;
        }
        if (this.direction.isZero()) return this.direction;
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

    tapStrafe(wishdir, blendFactor = 0.15) {
        // Preserve vertical velocity separately
        const oldY = this.body.velocity.y;

        // Project velocity onto the wishdir (forward component)
        const projSpeed = this.body.velocity.dot(wishdir);
        const velProj = new Vec3();
        wishdir.scale(projSpeed, velProj);  // velProj = wishdir * projSpeed

        // Sideways component = velocity - projected
        const velSide = new Vec3();
        this.body.velocity.vsub(velProj, velSide);

        // Blend sideways velocity back toward wishdir (tap strafe feel)
        velSide.scale(1 - blendFactor, velSide);

        // New horizontal velocity = velProj + adjusted side
        const newVel = new Vec3();
        velProj.vadd(velSide, newVel);

        // Write back to body, preserving Y
        this.body.velocity.copy(newVel);
        this.body.velocity.y = oldY;
    }

}