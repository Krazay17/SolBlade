import { netSocket } from "../../core/NetManager";
import PlayerState from "./_PlayerState";

export default class IdleState extends PlayerState {
    enter() {
        this.actor.movement.grounded = true;

        switch (this.pivot(true)) {
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
}