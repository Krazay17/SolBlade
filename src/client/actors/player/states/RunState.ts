import State from "@solblade/common/actors/states/State";
import { ACTIONS } from "@solblade/client/config/Actions";

export default class RunState extends State {
    update(dt) {
        if (!this.movement.groundChecker.isGrounded()) return this.setState('fall');
        if (this.controller.actionStates[ACTIONS.JUMP]) return this.setState("jump");
        const dir = this.controller.inputDirection();
        if (!dir) return this.setState('idle');
        this.movement.smartMove(dt, dir);
        const animScale = 1 + this.movement.momentum?.getBoost() / 20;
        this.animation.changeTimeScale(animScale);

        switch (this.pivot()) {
            case "Front":
                this.animation.playAnimation({ name: 'run' });
                break;
            case 'Back':
                this.animation.playAnimation({ name: 'runBwd' });
                break;
            case 'Left':
                this.animation.playAnimation({ name: 'strafeLeft' });
                break;
            case 'Right':
                this.animation.playAnimation({ name: 'strafeRight' });
                break;
            default:
                this.animation.playAnimation({ name: 'run' });
        }
    }
}