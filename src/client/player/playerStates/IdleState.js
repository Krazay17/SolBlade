import { netSocket } from "../../core/NetManager";
import PlayerState from "./_PlayerState";

export default class IdleState extends PlayerState {
    enter(state) {
        this.actor.movement.grounded = true;
        this.actor.energy.regenRate = this.actor.energy.baseRegenRate;
        if (state === 'attack') return this.idle();
        switch (this.pivot(true)) {
            case 'Front':
                this.animationManager?.playAnimation('runStopFwd', false, false, () => this.idle()) || this.idle();
                break;
            case 'Left':
                this.animationManager?.playAnimation('runStopLeft', false, false, () => this.idle()) || this.idle();
                break;
            case 'Right':
                this.animationManager?.playAnimation('runStopRight', false, false, () => this.idle()) || this.idle();
                break;
            case 'Back':
                this.animationManager?.playAnimation('runStopBack', false, false, () => this.idle()) || this.idle();
                break;
            default:
                this.idle();
        }
    }
    idle() {
        this.animationManager?.playAnimation('idle', true);
    }
    update(dt) {
        if (!this.movement.isGrounded()) {
            this.manager.setState('fall');
            return;
        }
        if (!this.movement.idleMove(dt)) {
            this.body.velocity = { x: 0, y: 0, z: 0 };
            this.body.sleep();
        }
        if (this.movement.getInputDirection().length() > 0) {
            this.manager.setState('run', this.actor.movement.floorTrace());
            return;
        }
    }
    canEnter() {
        if (!this.movement.isGrounded()) {
            this.stateManager.setState('fall')
            return false;
        }
        if (this.movement.getInputDirection().length() !== 0) {
            this.stateManager.setState('run')
            return false;
        }
        return true;
    }
}