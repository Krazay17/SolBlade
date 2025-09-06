import { netSocket } from "../../core/NetManager";
import PlayerState from "./_PlayerState";

export default class IdleState extends PlayerState {
    enter() {
        this.actor.animator?.setAnimState('idle');
    }
    update(dt) {
        if (!this.actor.movement.idleMove(dt)) {
            this.body.sleep();
        }

        if (!this.actor.movement.getInputDirection().isZero()) {
            this.manager.setState('run', this.actor.floorTrace());
            return;
        }

        if (this.input.keys['Space']) {
            this.manager.setState('jump');
            return;
        }

        if (!this.actor.groundChecker.isGrounded()) {
            this.manager.setState('fall');
            return;
        }
    }
    exit() {
        if (!netSocket.active && netSocket.disconnected) {
            netSocket.connect();
        }
        this.body.wakeUp();
    }
    canEnter() {
        if (!this.actor.groundChecker.isGrounded()) {
            this.manager.setState('fall');
            return false;
        }
        if (!this.actor.movement.getInputDirection().isZero()) {
            this.manager.setState('run', this.actor.floorTrace());
            return false;
        }
        return true;
    }
}