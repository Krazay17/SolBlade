import { Vector3, Vector2 } from 'three';
import Globals from '../utils/Globals';
export default class PlayerState {
    constructor(actor) {
        this.actor = actor;
        this.body = actor.body;
        this.speed = actor.speed;
        this.accel = actor.acceleration;
        this.idleDecel = 0.9;
        this.runDecel = 0.95;
        this.jumpDecel = 0.998;
        this.direction = new Vector3();
        this.dir2d = new Vector2();
        this.cur2d = new Vector2();
        this.new2d = new Vector2();


    }
    enter() { }
    update(dt, inputs) { }
    exit() { }

    setAnimState(state) {
        this.actor?.setAnimState?.(state);
    };

    movementVelocity(dt, inputs, accel, decel, maxSpeed) {
        // Decelerate horizontally
        this.body.velocity.x *= decel;
        this.body.velocity.z *= decel;

        if (this.direction.length() === 0) return;

        const { rotatedX, rotatedZ } = this.getInputVector(inputs);

        // Input direction as a vector
        this.dir2d.set(rotatedX, rotatedZ);
        this.dir2d.normalize();

        // Current velocity as a vector
        this.cur2d.set(this.body.velocity.x, this.body.velocity.z);

        // Project velocity onto input direction
        const projectedSpeed = this.cur2d.dot(this.dir2d);

        // Only accelerate if projected speed is less than max speed
        if (projectedSpeed < maxSpeed || this.dir2d.dot(this.cur2d.clone().normalize()) < 0) {
            // Add acceleration in input direction
            this.cur2d.add(this.dir2d.clone().multiplyScalar(accel * dt));
        }

        this.body.velocity.x = this.cur2d.x;
        this.body.velocity.z = this.cur2d.y;
    }

    getInputDirection(inputs) {
        this.direction.set(0, 0, 0);

        // Gather input directions
        if (inputs.keys['KeyW']) this.direction.z -= 1;
        if (inputs.keys['KeyS']) this.direction.z += 1;
        if (inputs.keys['KeyA']) this.direction.x -= 1;
        if (inputs.keys['KeyD']) this.direction.x += 1;
        this.direction.normalize();
    }

    getInputVector(inputs) {
        // Rotate input direction by controller yaw
        const yaw = inputs.yaw;
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);

        const rotatedX = this.direction.x * cosYaw + this.direction.z * sinYaw;
        const rotatedZ = -this.direction.x * sinYaw + this.direction.z * cosYaw;

        return { rotatedX, rotatedZ };
    }
}

export class IdleState extends PlayerState {
    enter() {
        this.actor.animator?.setState('idle', { doesLoop: true, prio: 1 });
    }
    update(dt, inputs) {
        // Decelerate horizontally
        this.body.velocity.x *= this.idleDecel;
        this.body.velocity.z *= this.idleDecel;

        if (inputs.keys['KeyW'] || inputs.keys['KeyA'] || inputs.keys['KeyS'] || inputs.keys['KeyD']) {
            this.actor.setState('run');
        }
        if (inputs.keys['Space']) {
            this.actor.setState('jump');
        }
    }
}

export class RunState extends PlayerState {
    enter() {
        this.accel = 225;
    }
    update(dt, inputs) {
        this.getInputDirection(inputs);
        this.movementVelocity(dt, inputs, this.accel, this.runDecel, this.actor.speed);

        // Jump
        if (inputs.keys['Space']) {
            this.actor.setState('jump');
            return;
        }
        if (inputs.keys['KeyW']) {
            this.direction.z -= 1;
            this.actor.animator.setState('run', { doesLoop: true, prio: 1 });
            return;
        }
        if (inputs.keys['KeyS']) {
            this.direction.z += 1;
            this.actor.animator.setState('run', { doesLoop: true, prio: 1 });
            return;
        }
        if (inputs.keys['KeyA']) {
            this.direction.x -= 1;
            this.actor.animator.setState('strafeLeft', { doesLoop: true, prio: 1 });
        }
        if (inputs.keys['KeyD']) {
            this.direction.x += 1;
            this.actor.animator.setState('strafeRight', { doesLoop: true, prio: 1 });
        }

        // If no movement, switch to idle
        if (this.direction.length() === 0) {
            this.actor.setState('idle');
            return;
        }
    }

}

export class JumpState extends PlayerState {
    enter() {
        this.body.velocity.y = 10;
        this.actor.animator.setState('jumping', { doesLoop: false, prio: 2 });
        this.jumpTimer = performance.now() + 500;
        this.accel = this.actor.acceleration * 2;
        this.maxSpeed = this.actor.speed;
    }
    update(dt, inputs) {
        this.getInputDirection(inputs);
        this.movementVelocity(dt, inputs, this.accel, this.jumpDecel, this.maxSpeed);

        if (this.jumpTimer < performance.now()) {
            this.actor.setState('fall');
            return;
        }
    }
}

export class FallState extends PlayerState {
    enter() {
        this.actor.animator?.setState('falling', { doesLoop: true, prio: 1 });
        this.accel = this.actor.acceleration / 2.5;
        this.maxSpeed = this.actor.speed / 2;
    }
    update(dt, inputs) {
        this.getInputDirection(inputs);
        this.movementVelocity(dt, inputs, this.accel, this.jumpDecel, this.maxSpeed);

        if (this.actor.floorTrace()) {
            this.actor.setState('idle');
            return;
        }
    }
}

export class AttackState extends PlayerState {
    enter() {
        this.accel = 20;
        this.maxSpeed = 2;
        this.timer = performance.now() + 50; // 500ms attack duration
        this.actor.animator.setState('attack', { doesLoop: false, prio: 2 });
    }
    update(dt, inputs) {
        this.getInputDirection(inputs);
        this.movementVelocity(dt, inputs, this.accel, this.jumpDecel, this.maxSpeed);

        if (performance.now() > this.timer) {
            this.actor.setState('idle');
        }
    }
}