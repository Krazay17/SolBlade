import { Vec3 } from 'cannon';
export default class PlayerState {
    constructor(actor, manager, options = {}) {
        this.actor = actor;
        this.manager = manager;
        this.body = actor.body;
        this.input = actor.input;

        this.maxGroundSpeed = 8;
        this.groundAccel = 8;
        this.maxAirSpeed = 6;
        this.airAccel = 4;
        this.airFriction = .01;
        this.friction = 3;
        this.airStrafe = .01;

        this.direction = new Vec3();
        this.current3d = new Vec3();
        this.tempVec = new Vec3();
        Object.assign(this, options);

    }
    enter() { }
    update(dt) { }
    exit() { }
    canEnter() {
        return true;
    }
    canExit() {
        return true;
    }

    setAnimState(state) {
        this.actor?.setAnimState?.(state);
    };

    isTryingToMove() {
        if (this.input.keys['KeyW'] || this.input.keys['KeyA'] || this.input.keys['KeyS'] || this.input.keys['KeyD']) {
            return true;
        }
        return false;
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

    accelerate(wishdir, wishspeed, accel, dt) {
        const scaledWishSpeed = wishspeed + this.actor.runBooster.getBoost();
        const currentVelocity = this.body.velocity.clone(); // speed in that direction
        currentVelocity.y = 0;
        const currentHorizSpeed = currentVelocity.dot(wishdir);

        const addSpeed = (scaledWishSpeed - currentHorizSpeed);
        if (addSpeed <= 0) return;

        this.tapStrafe(wishdir, this.airStrafe);

        const accelSpeed = Math.min(accel * scaledWishSpeed * dt, addSpeed);
        this.body.velocity.x += wishdir.x * accelSpeed;
        this.body.velocity.z += wishdir.z * accelSpeed;
    }

    applyFriction(dt, friction = this.friction) {
        const speed = Math.hypot(this.body.velocity.x, this.body.velocity.z);
        if (speed < 0.0001) return;

        const drop = speed * friction * dt;
        const newSpeed = Math.max(speed - drop, 0);

        const scale = newSpeed / speed;
        this.body.velocity.x *= scale;
        this.body.velocity.z *= scale;
    }

    groundMove(dt) {
        // 1. Friction
        this.applyFriction(dt);

        // 2. Get input direction
        const wishdir = this.getInputDirection(); // normalized Vector3 (x,z)
        if (wishdir.almostZero()) return;

        const wishspeed = this.maxGroundSpeed;

        // 3. Accelerate
        this.accelerate(wishdir, wishspeed, this.groundAccel, dt);
    }

    airMove(dt) {
        this.applyFriction(dt, this.airFriction);
        const wishdir = this.getInputDirection();
        if (wishdir.almostZero()) return;

        const wishspeed = this.maxAirSpeed;

        this.accelerate(wishdir, wishspeed, this.airAccel, dt);
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