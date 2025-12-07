import State from "@solblade/common/actors/states/State";
import type { Player } from "@solblade/common/core/Interfaces";

export default class FallState extends State<Player> {
    update(dt) {
        if (this.movement.isGrounded) return this.setState('idle');
        const dir = this.controller.inputDirection();
        this.movement.airMove(dt, dir);
        this.anim();
    }

    anim() {
        switch (this.pivot(true)) {
            case 'Front':
                this.animation?.playAnimation('fall', true);
                break;
            case 'Left':
                this.animation?.playAnimation('fallLeft', true) || this.animation?.playAnimation('fall', true);
                break;
            case 'Right':
                this.animation?.playAnimation('fallRight', true) || this.animation?.playAnimation('fall', true);
                break;
            case 'Back':
                this.animation?.playAnimation('fallBwd', true) || this.animation?.playAnimation('fall', true);
                break;
            default:
                this.animation?.playAnimation('fall', true);
        }
    }
}