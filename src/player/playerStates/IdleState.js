import { netSocket } from "../../core/NetManager";
import PlayerState from "./_PlayerState";

export default class IdleState extends PlayerState {
    enter() {
        this.actor.animator?.setAnimState('idle');
        this.actor.movement.grounded = true;
    }
    update(dt) {
        if (!this.actor.movement.idleMove(dt)) {
            this.body.velocity.set(0, 0, 0);
            this.body.angularVelocity.set(0, 0, 0);
            this.body.sleep();
        }

        if (!this.actor.movement.getInputDirection().isZero()) {
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
        if (!this.actor.movement.getInputDirection().isZero()) {
            this.manager.setState('run', this.actor.movement.floorTrace());
            return false;
        }
        return true;
    }
}