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
    enter() { }
    update(dt, inputs) {
        if (inputs.keys['KeyW'] || inputs.keys['KeyA'] || inputs.keys['KeyS'] || inputs.keys['KeyD']) {
            this.actor.setState('walk');
        }
        if (inputs.keys['Space']) {
            this.actor.setState('jump');
        }
    }
}
export class WalkState extends PlayerState {
    enter() { }
    update(dt, inputs) {
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

        // If no movement, switch to idle
        if (direction.length() === 0) {
            this.actor.setState('idle');
            return;
        }

        direction.normalize();

        // Rotate input direction by controller yaw
        const yaw = inputs.yaw;
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);

        const rotatedX = direction.x * cosYaw + direction.z * sinYaw;
        const rotatedZ = -direction.x * sinYaw + direction.z * cosYaw;

        // Apply acceleration
        this.body.velocity.x += rotatedX * this.actor.acceleration * dt;
        this.body.velocity.z += rotatedZ * this.actor.acceleration * dt;

        // Clamp horizontal speed
        const horizontalSpeed = Math.sqrt(this.body.velocity.x ** 2 + this.body.velocity.z ** 2);
        if (horizontalSpeed > this.actor.speed) {
            const scale = this.actor.speed / horizontalSpeed;
            this.body.velocity.x *= scale;
            this.body.velocity.z *= scale;
        }

        // Jump
        if (inputs.keys['Space']) {
            this.actor.setState('jump');
        }
    }

}
export class JumpState extends PlayerState {
    enter() {
        this.body.velocity.y = 12;
        this.actor.setState('idle');
    }
}