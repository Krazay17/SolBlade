import { Vec3 } from "cannon";
import LocalData from "../core/LocalData";
import { projectOnPlane, clampVector } from "../utils/Utils";
import RunBoost from "./MomentumBoost";

export default class PlayerMovement {
    constructor(actor) {
        this.actor = actor;
        this.body = actor.body;
        this.input = actor.input;

        this.momentumBooster = new RunBoost(actor);
        this.direction = new Vec3();
        this.upDir = new Vec3(0, 1, 0);
        this.tempVec = new Vec3();
        this.tempVec2 = new Vec3();
        this.tempVec3 = new Vec3();
        this.tempVec4 = new Vec3();
        this.tempVec5 = new Vec3();
        this.dashValue = 0;

        const savedValues = LocalData.movementValues;
        this.values = savedValues ?? {
            idle: {
                friction: 20,
            },
            ground: {
                friction: 8,
                accel: 14,
                speed: 5,
                tap: 0
            },
            air: {
                friction: 0,
                accel: 4,
                speed: 4,
                tap: 0
            },
            blade: {
                friction: 0.1,
                accel: 2,
                speed: 8,
                tap: 0
            },
            attack: {
                friction: 2,
                accel: 10,
                speed: 3,
                tap: 0
            },
            dash: {
                speed: 17
            }
        }


        window.addEventListener('beforeunload', () => {
            LocalData.movementValues = this.values;
            LocalData.save();
        });
    }

    update(dt) {
        this.momentumBooster.update(dt, this.body.velocity);
    }

    resetDefaultValues() {
        this.values = {
            idle: {
                friction: 20,
            },
            ground: {
                friction: 8,
                accel: 14,
                speed: 5,
                tap: 0
            },
            air: {
                friction: 0,
                accel: 4,
                speed: 4,
                tap: 0
            },
            blade: {
                friction: 0.1,
                accel: 2,
                speed: 8,
                tap: 0
            },
            attack: {
                friction: 2,
                accel: 10,
                speed: 3,
                tap: 0
            },
            dash: {
                speed: 17
            }
        }
        return this.values;
    }

    idleMove(dt) {
        this.applyFriction(dt, this.values.idle.friction);
        if (this.body.velocity.almostZero(.1)) {
            return false;
        }
        return true;
    }

    attackMove(dt) {
        this.applyFriction(dt, this.values.attack.friction);
        this.body.velocity.y *= .98;
        const wishdir = this.getInputDirection();
        this.accelerate(wishdir, this.values.attack.speed, this.values.attack.accel, dt, this.values.attack.tap);
    }

    groundMove(dt) {
        this.applySlopeFriction(dt, this.values.ground.friction);

        let wishdir = this.getInputDirection();
        let wishspeed = this.values.ground.speed + this.momentumBooster.increaseBoost(dt);
        if (wishdir.almostZero()) return;
        wishdir = projectOnPlane(wishdir, this.actor.groundChecker.floorNormal());

        this.accelerate(wishdir, wishspeed, this.values.ground.accel, dt, this.values.ground.tap);
        this.clampHorizontalSpeed(wishspeed, 1);
    }

    airMove(dt) {
        this.applyFriction(dt, this.values.air.friction);

        const wishdir = this.getInputDirection();
        if (wishdir.almostZero()) return;

        this.accelerate(wishdir, this.values.air.speed, this.values.air.accel, dt, this.values.air.tap);
        this.clampHorizontalSpeed(this.values.air.speed, .01);
    }

    bladeStart(pwr = 1) {
        const v = this.body.velocity.clone();
        const vN = v.clone();
        vN.normalize();
        const n = this.actor.groundChecker.floorNormal(); // Should be a normalized Vec3
        //n.cross(this.upDir, this.tempVec);
        //n.cross(this.tempVec, this.tempVec); // Re-orthogonalize to ensure precision
        if (!n) return;
        const vdot = v.dot(n);
        let boost = 1 + ((1 - this.upDir.dot(n)) * (1 - Math.abs(vN.dot(n))));
        this.momentumBooster.increaseBoost((1 - boost) * 50, 50);
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
        this.applyFriction(dt, this.values.blade.friction);
        //this.applySlopeFriction(dt, this.values.blade.friction);

        let wishdir = this.getInputDirection();
        let wishspeed = this.values.blade.speed + this.momentumBooster.increaseBoost(dt, 10);
        if (wishdir.almostZero()) return;
        // Project wishdir onto slope plane
        wishdir = projectOnPlane(wishdir, this.actor.groundChecker.floorNormal());
        wishdir.normalize();
        this.accelerate(
            wishdir,
            wishspeed,
            this.values.blade.accel,
            dt,
            this.values.blade.tap
        );

    }

    slopeBoost(pwr = 1, dt) {
        const n = this.actor.groundChecker.floorNormal();
        if (!n) return;

        // Project gravity onto the slope plane
        const gravity = this.tempVec2.set(0, -9.8 * pwr, 0);
        const gravityDot = gravity.dot(n);
        const gravityAlongSlope = gravity.vsub(n.scale(gravityDot));

        // Scale by dt for frame rate independence
        gravityAlongSlope.scale(dt, gravityAlongSlope);

        // Add to velocity
        this.body.velocity.vadd(gravityAlongSlope, this.body.velocity);
    }

    dashStart() {
        this.getInputDirection(-1);
        this.dashValue = Math.max(this.values.dash.speed, this.body.velocity.length());
    }
    dashMove(dt, decay = 40, min = 10) {
        this.dashValue = Math.max(min, this.dashValue - decay * dt);
        console.log(this.dashValue);
        const dashVelocity = this.direction.scale(this.dashValue);
        this.body.velocity.copy(dashVelocity);
    }
    dashStop() {
        const currentVel = this.body.velocity.clone();
        this.body.velocity = clampVector(currentVel, 12);
        //currentVel.mult(0.9, this.body.velocity);
    }

    jumpStart() {
        const currentVY = this.body.velocity.clone().y;
        const jumpV = 6.66;
        if (currentVY < 0) {
            this.body.velocity.y = jumpV;
        } else {
            const scaledjumpV = Math.max(0, currentVY - jumpV);
            const finaljumpV = jumpV + scaledjumpV;

            this.body.velocity.y = Math.min(jumpV * 2, currentVY + jumpV);
        }
    }

    applyFriction(dt, friction) {
        //const speed = Math.hypot(this.body.velocity.x, this.body.velocity.z);
        const speed = this.body.velocity.length();
        if (speed < 0.0001) return;

        const drop = speed * friction * dt;
        const newSpeed = Math.max(speed - drop, 0);

        const scale = newSpeed / speed;
        // this.body.velocity.x *= scale;
        // this.body.velocity.y *= scale;
        // this.body.velocity.z *= scale;
        this.body.velocity.mult(scale, this.body.velocity)
    }

    applySlopeFriction(dt, friction) {
        const n = this.actor.groundChecker.floorNormal();
        if (!n) {
            this.applyFriction(dt, friction);
            return;
        }
        // Project velocity onto slope plane
        const v = this.body.velocity;
        const vdot = v.dot(n);
        const vProj = v.vsub(n.scale(vdot));
        const speed = vProj.length();
        if (speed < 0.0001) return;

        const drop = speed * friction * dt;
        const newSpeed = Math.max(speed - drop, 0);

        const scale = newSpeed / speed;
        vProj.scale(scale, vProj);

        // Add back the normal component
        const newVel = vProj.vadd(n.scale(vdot));
        this.body.velocity.copy(newVel);
    }

    accelerate(wishdir, wishspeed, accel, dt, tapBlend) {
        const currentVelocity = this.body.velocity.clone(); // speed in that direction
        currentVelocity.y = 0;
        const currentHorizSpeed = currentVelocity.dot(wishdir);

        const addSpeed = (wishspeed - currentHorizSpeed);
        if (addSpeed <= 0) return false;

        //this.tapStrafe(wishdir, tapBlend);
        //this.momentumDrift(wishdir, tapBlend);

        const accelSpeed = Math.min(accel * wishspeed * dt, addSpeed);
        this.body.velocity.x += wishdir.x * accelSpeed;
        this.body.velocity.z += wishdir.z * accelSpeed;
        this.body.velocity.y += wishdir.y * accelSpeed;

        
        this.clampHorizontalSpeed(wishspeed, .02);

    }
    clampHorizontalSpeed(maxSpeed, pwr = 1) {
        const v = this.body.velocity;
        const horizSpeed = Math.hypot(v.x, v.z);
        if (horizSpeed > maxSpeed) {
            const scale = Math.pow(maxSpeed / horizSpeed, pwr);
            v.x *= scale;
            v.z *= scale;
        }
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



    // tapStrafe(wishdir, blendFactor = 0.15) {
    //     if (wishdir.isZero()) return;
    //     // Preserve vertical velocity separately
    //     const currentV = this.body.velocity.clone();
    //     currentV.y = 0;
    //     const oldY = this.body.velocity.y;

    //     // Project velocity onto the wishdir (forward component)
    //     const projSpeed = currentV.dot(wishdir);
    //     wishdir.scale(projSpeed, this.tempVec3);

    //     // Sideways component = velocity - projected
    //     this.body.velocity.vsub(this.tempVec3, this.tempVec4);

    //     // Blend sideways velocity back toward wishdir (tap strafe feel)
    //     this.tempVec4.scale(1 - blendFactor, this.tempVec4);

    //     // New horizontal velocity = velProj + adjusted sideways
    //     this.tempVec3.vadd(this.tempVec4, this.tempVec5);

    //     // Write back to body, preserving Y
    //     this.body.velocity.x = this.tempVec5.x;
    //     this.body.velocity.z = this.tempVec5.z;
    //     //this.body.velocity.y = oldY;
    // }
    tapStrafe(wishdir, blendFactor = 0.15) {
        if (wishdir.isZero()) return;

        // Get current horizontal velocity
        const currentV = this.body.velocity.clone();
        currentV.y = 0;
        const speed = currentV.length();
        if (speed < 0.0001) return;
        if (blendFactor <= 0) return;

        this.tempVec3.copy(currentV).scale(1 - blendFactor);
        this.tempVec4.copy(wishdir).scale(blendFactor);
        this.tempVec3.vadd(this.tempVec4, this.tempVec3);

        // Apply blended direction, preserve speed and Y
        this.body.velocity.x = this.tempVec3.x
        this.body.velocity.z = this.tempVec3.z
    }

    momentumDrift(wishdir, blendFactor = 0.15) {
        if (wishdir.isZero()) return;
        // Get current horizontal velocity
        const currentV = this.body.velocity.clone();
        currentV.y = 0;
        const projectV = currentV.dot(wishdir);
        console.log(projectV)
    }

    // tapStrafe2(wishdir, blendFactor = 0.15, horizontalSpeed = 0) {
    //     if (wishdir.isZero()) return;
    //     // Preserve vertical velocity separately
    //     const currentV = this.body.velocity.clone();
    //     const oldY = this.body.velocity.y;

    //     // Project velocity onto the wishdir (forward component)
    //     const projSpeed = currentV.dot(wishdir);
    //     wishdir.scale(projSpeed, this.tempVec3);

    //     // Sideways component = velocity - projected
    //     this.body.velocity.vsub(this.tempVec3, this.tempVec4);

    //     // Blend sideways velocity back toward wishdir (tap strafe feel)
    //     this.tempVec4.scale(1 - blendFactor, this.tempVec4);

    //     // New horizontal velocity = velProj + adjusted sideways
    //     this.tempVec3.vadd(this.tempVec4, this.tempVec5);

    //     // Write back to body, preserving Y
    //     this.body.velocity.copy(this.tempVec5);
    //     this.body.velocity.y = oldY;
    // }

}