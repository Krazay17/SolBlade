import State from "@solblade/common/actors/states/State";

export default class FallState extends State {
    update(dt) {
        if (this.movement.isGrounded) return this.setState('idle');
        const dir = this.controller.inputDirection();
        if (dir) {
            this.movement.airMove(dt, dir);
        }
        this.anim();
    }

    anim() {
        switch (this.pivot(true)) {
            case 'Front':
                this.animation?.playAnimation({ name: 'fall' });
                break;
            case 'Left':
                this.animation?.playAnimation({ name: 'fallLeft' })
                break;
            case 'Right':
                this.animation?.playAnimation({ name: 'fallRight' })
                break;
            case 'Back':
                this.animation?.playAnimation({ name: 'fallBwd' })
                break;
            default:
                this.animation?.playAnimation({ name: 'fall' });
        }
    }
}