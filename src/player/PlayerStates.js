import { Vec3 } from 'cannon';
class PlayerState {
    constructor(actor, manager, options = {}) {
        this.actor = actor;
        this.manager = manager;
        this.body = actor.body;
        this.maxSpeed = actor.maxSpeed;
        this.accel = actor.acceleration;
        this.groundFriction = 0.8;
        this.airFriction = 0.995;
        this.airSpeed = 2;
        this.direction = new Vec3();
        this.current3d = new Vec3();
        this.input = actor.input;
        Object.assign(this, options);

    }
    enter() { }
    update(dt) { }
    exit() { }

    setAnimState(state) {
        this.actor?.setAnimState?.(state);
    };

    movementVelocity(dt, accel, maxSpeed, friction = 1, decel = 1) {
        const inputDir = this.getInputDirection();

        if (inputDir.almostZero()) {
            this.body.velocity.x *= friction;
            this.body.velocity.z *= friction;
            return;
        }
        this.body.velocity.x *= decel;
        this.body.velocity.z *= decel;
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
    enter() {
        this.actor.animator?.setAnimState('Idle');
    }
    update(dt) {
        // Decelerate horizontally
        this.body.velocity.x *= this.groundFriction;
        this.body.velocity.z *= this.groundFriction;

        if (this.input.keys['KeyW'] || this.input.keys['KeyA'] || this.input.keys['KeyS'] || this.input.keys['KeyD']) {
            this.actor.setState('run');
            return;
        }
        if (this.input.keys['Space']) {
            this.actor.setState('jump');
            return;
        }
        if (this.input.keys['ShiftLeft'] && this.manager.tryDash()) {
            return;
        }
    }
}

export class RunState extends PlayerState {
    enter() {
        this.accel = 300;
    }
    update(dt) {
        this.movementVelocity(dt, this.accel, this.maxSpeed, this.groundFriction, this.groundFriction);
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
            this.actor.animator.setAnimState('Run');
        }
        if (this.input.keys['KeyS']) {
            strafe = false;
            this.actor.animator.setAnimState('Run');
        }
        if (this.input.keys['KeyA']) {
            if (strafe) {
                this.actor.animator.setAnimState('StrafeLeft');
            }
        }
        if (this.input.keys['KeyD']) {
            if (strafe) {
                this.actor.animator.setAnimState('StrafeRight');
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
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.accel = options.accel || this.accel;
        this.maxSpeed = options.maxSpeed || this.maxSpeed;
        this.airFriction = options.airFriction || this.airFriction;
    }
    enter() {
        this.body.velocity.y = 9;
        this.actor.animator.setAnimState('Jump');
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
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.accel = options.accel || this.accel;
        this.maxSpeed = options.maxSpeed || this.maxSpeed;
        this.airFriction = options.airFriction || this.airFriction;
    }
    enter() {
        this.actor.animator?.setAnimState('FallLoop');
    }
    update(dt) {
        this.movementVelocity(dt, this.accel, this.maxSpeed, this.airFriction);

        if (this.input.keys['ShiftLeft'] && this.manager.tryDash()) {
            return;
        }
        if (this.actor.floorTrace()) {
            this.actor.setState('idle');
            return;
        }
    }
}

export class AttackState extends PlayerState {
    constructor(actor, manager, options = { accel: 600, maxSpeed: 1 }) {
        super(actor, manager, options);
        this.accel = options.accel || this.accel;
        this.maxSpeed = options.maxSpeed || this.maxSpeed;
    }
    enter() {
        this.timer = performance.now() + 610;
        this.actor.animator.setAnimState('AttackCombo', true, .15);
    }
    update(dt) {
        this.movementVelocity(dt, this.accel, this.maxSpeed, this.groundFriction, this.groundFriction);

        if (performance.now() > this.timer) {
            this.actor.stateManager.setState('idle');
        }
    }
}

export class KnockbackState extends PlayerState {
    enter(dir) {
        dir.mult(35, this.body.velocity);

        //this.actor.animator.setState('knockback', { doesLoop: false, prio: 2 });
        this.timer = performance.now() + 800;
    }
    update(dt) {
        this.movementVelocity(dt, this.accel, this.maxSpeed, .98);
        if (this.timer > performance.now()) return;
        if (this.actor.floorTrace()) {
            this.actor.setState('idle');
            return;
        } else {
            this.actor.setState('fall');
            return;
        }
    }
}

export class DashState extends PlayerState {
    constructor(actor, manager, options = { cd: 1000 }) {
        super(actor, manager, options);
    }
    enter() {
        this.actor.animator.setAnimState('Dash');
        this.timer = performance.now() + 200;
        const dir = this.getInputDirection(-1);
        dir.normalize();
        dir.mult(35, this.body.velocity);
    }
    update(dt) {
        this.movementVelocity(dt, this.accel, this.maxSpeed, this.airFriction);
        if (this.timer < performance.now()) {
            this.manager.setState('idle');
            return;
        }
    }
    exit() {
        const curVel = this.body.velocity;
        curVel.mult(0.3, this.body.velocity);
    }
}