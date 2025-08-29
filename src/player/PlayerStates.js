import { Vec3 } from 'cannon';
import { Vector3 } from 'three';
class PlayerState {
    constructor(actor, manager, options = {}) {
        this.actor = actor;
        this.manager = manager;
        this.body = actor.body;
        this.input = actor.input;

        this.maxSpeed = actor.maxSpeed;
        this.accel = actor.acceleration;
        this.groundFriction = 0.875;
        this.airFriction = 0.995;
        this.airSpeed = 2;
        this.dashSpeed = 25;
        this.runBoost = 0;
        this.direction = new Vec3();
        this.current3d = new Vec3();
        Object.assign(this, options);

    }
    enter() { }
    update(dt) { }
    exit() { }

    isTryingToMove() {
        if (this.input.keys['KeyW'] || this.input.keys['KeyA'] || this.input.keys['KeyS'] || this.input.keys['KeyD']) {
            return true;
        }
        return false;
    }

    setAnimState(state) {
        this.actor?.setAnimState?.(state);
    };

    movementVelocity(dt, accel, maxSpeed, friction = 1, decel = 1) {
        const inputDir = this.getInputDirection();
        const lastVelocity = this.body.velocity.clone();
        lastVelocity.y = 0;
        lastVelocity.normalize();
        const speedAdd = Math.max(0, lastVelocity.dot(this.direction));
        this.runBoost += speedAdd * 10 * dt;
        this.runBoost = Math.min(5000, this.runBoost * speedAdd);
        console.log(this.runBoost);

        if (inputDir.almostZero()) {
            this.body.velocity.x *= friction;
            this.body.velocity.z *= friction;
            return;
        }
        //Project velocity onto input direction
        const horizClone = this.body.velocity.clone();
        horizClone.y = 0;
        // Get the amount of velocity in the input direction
        const projectedSpeed = horizClone.dot(inputDir);

        // Only accelerate if projected speed is less than max speed
        if (projectedSpeed < maxSpeed) {
            this.body.velocity.x += inputDir.x * accel * dt;
            this.body.velocity.z += inputDir.z * accel * dt;
        }
        this.body.velocity.x *= decel;
        this.body.velocity.z *= decel;
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

        const { rotatedX, rotatedZ } = this.rotateInputVector();

        // Input direction as a vector
        this.direction.set(rotatedX, 0, rotatedZ);
        this.direction.normalize();
        return this.direction;
    }

    rotateInputVector() {
        // Rotate input direction by controller yaw
        const yaw = this.input.yaw;
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);

        const rotatedX = this.direction.x * cosYaw + this.direction.z * sinYaw;
        const rotatedZ = -this.direction.x * sinYaw + this.direction.z * cosYaw;

        return { rotatedX, rotatedZ };
    }


}

export class IdleState extends PlayerState {
    enter(floor) {
        console.log(`Floor: ${floor}`);
        if (this.isTryingToMove()) {
            this.actor.setState('run', floor);
            return;
        }
        this.actor.animator?.setAnimState('idle');
    }
    update(dt) {
        // Decelerate horizontally
        this.body.velocity.x *= this.groundFriction;
        this.body.velocity.z *= this.groundFriction;

        if (this.isTryingToMove()) {
            this.actor.setState('run', this.actor.floorTrace());
            return;
        }

        if (this.input.keys['Space']) {
            this.actor.setState('jump');
            return;
        }
        if (this.input.keys['ShiftLeft'] && this.manager.tryDash()) {
            return;
        }

        if (!this.actor.floorTrace()) {
            this.actor.setState('fall');
            return;
        }
    }
}

export class RunState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
    }
    enter(floorDot) {
        this.actor.animator?.setAnimState('run');
        this.accel = 300;
        const floorValue = 1 - floorDot;
        if (floorDot) {
            this.runBoost *= 1 + floorValue;
            console.log(`Floor: ${1 + floorValue}`);
        }
    }
    update(dt) {

        this.movementVelocity(dt, this.accel + this.runBoost, this.maxSpeed + this.runBoost, this.groundFriction, this.groundFriction);


        let strafe = true;

        // Jump
        if (this.input.keys['Space']) {
            this.actor.setState('jump');
            return;
        }
        if (this.input.keys['ShiftLeft'] && this.manager.tryDash()) {
            return;
        }
        if (this.input.keys['KeyW']) {
            strafe = false;
            this.actor.animator.setAnimState('run');
        }
        if (this.input.keys['KeyS']) {
            strafe = false;
            this.actor.animator.setAnimState('run');
        }
        if (this.input.keys['KeyA']) {
            if (strafe) {
                this.actor.animator.setAnimState('strafeLeft');
            }
        }
        if (this.input.keys['KeyD']) {
            if (strafe) {
                this.actor.animator.setAnimState('strafeRight');
            }
        }

        if (!this.actor.floorTrace()) {
            this.actor.setState('fall');
            return;
        }

        // If no movement, switch to idle
        if (this.direction.length() === 0) {
            this.actor.setState('idle');
            return;
        }
    }

}

export class JumpState extends PlayerState {
    constructor(actor, manager, options = { accel: 100, maxSpeed: 3, airFriction: .99 }) {
        super(actor, manager, options);
    }
    enter() {
        this.body.velocity.y = 9.8;
        this.actor.animator.setAnimState('jump');
        this.jumpTimer = performance.now() + 300;
    }
    update(dt) {
        this.movementVelocity(dt, this.accel, this.maxSpeed, this.airFriction);

        if (this.input.keys['ShiftLeft'] && this.manager.tryDash()) {
            return;
        }
        if (this.jumpTimer < performance.now()) {
            this.actor.setState('fall');
            return;
        }
    }
}

export class FallState extends PlayerState {
    constructor(actor, manager, options = { accel: 50, maxSpeed: 3, airFriction: .99 }) {
        super(actor, manager, options);
    }
    enter() {
        this.actor.animator?.setAnimState('fall');
    }
    update(dt) {
        this.movementVelocity(dt, this.accel, this.maxSpeed, this.airFriction);

        if (this.input.keys['ShiftLeft'] && this.manager.tryDash()) {
            return;
        }
        const floor = this.actor.floorTrace();
        if (floor) {
            this.actor.setState('idle', floor);
            return;
        }
    }
}

export class AttackState extends PlayerState {
    constructor(actor, manager, options = { accel: 400, maxSpeed: 2 }) {
        super(actor, manager, options);
    }
    enter() {
        this.timer = performance.now() + 610;
        this.actor.animator.setAnimState('attack');
    }
    update(dt) {
        this.movementVelocity(dt, this.accel, this.maxSpeed, this.groundFriction, this.groundFriction);
        this.body.velocity.y *= 0.95;

        if (performance.now() > this.timer) {
            this.actor.stateManager.setState('idle');
        }
    }
}

export class KnockbackState extends PlayerState {
    enter(dir) {
        dir.mult(35, this.body.velocity);

        this.timer = performance.now() + 800;
        this.actor.animator.setAnimState('knockBack');
    }
    update(dt) {
        if (this.timer > performance.now()) return;
        this.actor.setState('idle');
        return;
    }
}

export class DashState extends PlayerState {
    constructor(actor, manager, options = { cd: 1500 }) {
        super(actor, manager, options);
    }
    enter() {
        this.actor.animator.setAnimState('dash');
        this.timer = performance.now() + 370;
        this.getInputDirection(-1);
        this.dashSpeed = 25;
    }
    update(dt) {
        this.direction.y = 0;
        this.dashSpeed -= 55 * dt;
        const dashVelocity = this.direction.scale(this.dashSpeed);
        this.body.velocity.copy(dashVelocity);
        if (this.timer < performance.now()) {
            this.manager.setState('idle');
            return;
        }
    }
    exit() {
        const curVel = this.body.velocity;
        curVel.mult(0.4, this.body.velocity);
    }
}

export class EmoteState extends IdleState {
    enter(emote) {
        this.actor.animator.setAnimState(emote);
    }
}

export class DeadState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
    }
    enter() {
        this.actor.animator.setAnimState('dead');
        this.body.velocity.set(0, 0, 0);
    }
    update(dt) {
        // Handle dead-specific logic here
        console.log("Player is dead");
    }
}