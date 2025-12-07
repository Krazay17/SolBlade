import State from "@solblade/common/actors/states/State";
import { ACTIONS } from "@solblade/client/config/Actions";
import { Player } from "@solblade/common/core/Interfaces";

export default class IdleState extends State<Player> {
    enter(state, params) {
        if (!this.movement.isGrounded) return this.setState('fall');
        if (state === 'attack') return this.idle();
        switch (this.pivot()) {
            case 'Front':
                this.animation?.playAnimation('runStopFwd', false, false, () => this.idle()) || this.idle();
                break;
            case 'Left':
                this.animation?.playAnimation('runStopLeft', false, false, () => this.idle()) || this.idle();
                break;
            case 'Right':
                this.animation?.playAnimation('runStopRight', false, false, () => this.idle()) || this.idle();
                break;
            case 'Back':
                this.animation?.playAnimation('runStopBack', false, false, () => this.idle()) || this.idle();
                break;
            default:
                this.idle();
        }
    }
    idle() {
        this.animation?.playAnimation('idle', true);
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