import State from "@solblade/common/actors/states/State";
import { ACTIONS } from "@solblade/client/config/Actions";

export default class IdleState extends State {
    enter(state, params) {
        if (!this.movement.isGrounded) return this.setState('fall');
        if (state === 'attack') return this.animation?.playAnimation({ name: "idle" });
        switch (this.pivot()) {
            case 'Front':
                this.animation?.playAnimation({ name: 'runStopFwd', loop: false }, { name: "idle" });
                break;
            case 'Left':
                this.animation?.playAnimation({ name: 'runStopLeft', loop: false }, { name: "idle" });
                break;
            case 'Right':
                this.animation?.playAnimation({ name: 'runStopRight', loop: false }, { name: "idle" });
                break;
            case 'Back':
                this.animation?.playAnimation({ name: "idle" });
                break;
            default:
                this.animation?.playAnimation({ name: "idle" });
        }
    }
    update(dt) {
        if (this.controller.actionStates[ACTIONS.JUMP]) return this.setState("jump");
        if (!this.movement?.isGrounded) return this.setState('fall');
        if (this.controller.inputDirection()) return this.setState('run');
        this.movement.idleMove(dt);
    }
    canEnter(state: any): boolean {
        if (this.movement.isGrounded) {
            return true
        } else {
            this.setState('fall');
            return false;
        }
    }
}