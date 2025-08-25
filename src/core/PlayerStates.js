import { Vector3 } from 'three';

let direction = new Vector3();

export default class PlayerState {
    constructor(actor) {
        this.actor = actor;
        this.body = actor.body;
    }
    enter() { }
    update(dt, inputs) { }
    exit() { }
}

export class IdleState extends PlayerState {
    enter() {
        this.actor.setAnimState('idle');
    }
    update(dt, inputs) {
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
        this.actor.setAnimState('run');
    }
    update(dt, inputs) {
        // Reset direction
        direction.set(0, 0, 0);

        // Decelerate horizontally
        this.body.velocity.x *= 0.98;
        this.body.velocity.z *= 0.98;

        // Gather input directions
        if (inputs.keys['KeyW']) {
            direction.z -= 1;
            this.actor.setAnimState('run');
        }
        if (inputs.keys['KeyS']) direction.z += 1;
        if (inputs.keys['KeyA']) {
            direction.x -= 1;
            if (!this.actor.getAnimState() === 'Run') {
                this.actor.setAnimState('strafeLeft');

            }
        }
        if (inputs.keys['KeyD']) {
            direction.x += 1;
            if (!this.actor.getAnimState() === 'Run') {
                this.actor.setAnimState('strafeRight');

            }
        }

        // If no movement, switch to idle
        if (direction.length() === 0) {
            this.actor.setState('idle');
            return;
        }

        const { rotatedX, rotatedZ } = getDirectionVector(inputs);
        this.body.velocity.x += rotatedX * this.actor.acceleration * dt;
        this.body.velocity.z += rotatedZ * this.actor.acceleration * dt;

        clampHorizontalSpeed(this.body, this.actor.speed);
        // Jump
        if (inputs.keys['Space']) {
            this.actor.setState('jump');
        }
    }

}
export class JumpState extends PlayerState {
    enter() {
        this.body.velocity.y = 12;
        this.actor.setAnimState('jumping');
        this.jumpTimer = performance.now() + 500;
    }
    update(dt, inputs) {
        if (this.jumpTimer < performance.now()) {
            this.actor.setAnimState('falling');
            if (this.actor.floorTrace()) {
                this.actor.setState('idle');
                return;
            }
        }
        // Reset direction
        direction.set(0, 0, 0);

        // Decelerate horizontally
        this.body.velocity.x *= 0.98;
        this.body.velocity.z *= 0.98;

        // Gather input directions
        if (inputs.keys['KeyW']) direction.z -= 1;
        if (inputs.keys['KeyS']) direction.z += 1;
        if (inputs.keys['KeyA']) direction.x -= 1;
        if (inputs.keys['KeyD']) direction.x += 1;

        const { rotatedX, rotatedZ } = getDirectionVector(inputs);
        this.body.velocity.x += rotatedX * this.actor.acceleration * dt;
        this.body.velocity.z += rotatedZ * this.actor.acceleration * dt;
    }
}

function getDirectionVector(inputs) {
    direction.normalize();

    // Rotate input direction by controller yaw
    const yaw = inputs.yaw;
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);

    const rotatedX = direction.x * cosYaw + direction.z * sinYaw;
    const rotatedZ = -direction.x * sinYaw + direction.z * cosYaw;

    return { rotatedX, rotatedZ };
}

function clampHorizontalSpeed(body, maxSpeed) {
    // Clamp horizontal speed
    const horizontalSpeed = Math.sqrt(body.velocity.x ** 2 + body.velocity.z ** 2);
    if (horizontalSpeed > maxSpeed) {
        const scale = maxSpeed / horizontalSpeed;
        body.velocity.x *= scale;
        body.velocity.z *= scale;
    }
}