import { netSocket } from "../../core/NetManager";
import { vectorsToLateralDegrees } from "../../utils/Utils";
import PlayerState from "./_PlayerState";

export default class IdleState extends PlayerState {
    enter() {
        this.actor.movement.grounded = true;

        switch (this.pivot()) {
            case 'Front':
                this.animationManager?.playAnimation('runStopFwd', false, () => this.animationManager?.playAnimation('idle', true)) || this.idle();
                break;
            case 'Left':
                this.animationManager?.playAnimation('runStopLeft', false, () => this.animationManager?.playAnimation('idle', true)) || this.idle();
                break;
            case 'Right':
                this.animationManager?.playAnimation('runStopRight', false, () => this.animationManager?.playAnimation('idle', true)) || this.idle();
                break;
            case 'Back':
                this.animationManager?.playAnimation('runStopBack', false, () => this.animationManager?.playAnimation('idle', true)) || this.idle();
                break;
            default:
                this.animationManager?.playAnimation('idle', true);
        }
    }
    idle() {
        this.animationManager?.playAnimation('idle', true);
    }
    update(dt) {
        if (!this.actor.movement.idleMove(dt)) {
            this.body.velocity = { x: 0, y: 0, z: 0 };
            this.body.sleep();
        }

        if (this.actor.movement.getInputDirection().length() > 0) {
            this.manager.setState('run', this.actor.movement.floorTrace());
            return;
        }

        if (this.input.keys['Space'] && this.manager.setState('jump')) {
            return;
        }

        if (!this.actor.movement.isGrounded()) {
            this.manager.setState('fall');
            return;
        }
    }
    exit() {
        if (netSocket.disconnected) {
            netSocket.connect();
        }
        this.body.wakeUp();
    }
    canEnter() {
        if (!this.actor.movement.isGrounded()) {
            this.manager.setState('fall');
            return false;
        }
        if (!this.actor.movement.getInputDirection().length() === 0) {
            this.manager.setState('run', this.actor.movement.floorTrace());
            return false;
        }
        return true;
    }
    pivot() {
        const dir = this.actor.getShootData().dir.normalize();
        const vel = this.body.velocity;
        if (vel.length() < .5) return "Neutral";
        vel.normalize();

        let angleDeg = vectorsToLateralDegrees(dir, vel);

        // Determine sector (0=Front, 1=Left, 2=Back, 3=Right)
        const sector = Math.floor((angleDeg + 45) / 90) % 4;
        switch (sector) {
            case 0: return "Front";
            case 1: return "Right";
            case 2: return "Back";
            case 3: return "Left";
        }
    }
}