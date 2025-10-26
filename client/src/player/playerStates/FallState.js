import PlayerState from "./_PlayerState";

export default class FallState extends PlayerState {
    enter() {
        this.actor.movement.fallStart();

        this.anim();
    }
    update(dt) {
        this.actor.movement.airMove(dt);

        if (this.actor.movement.isGrounded()) {
            this.manager.setState('idle');
            return;
        }

        if (this.input.actionStates.jump
            && this.manager.setState('jump')) {
            return;
        }
        this.anim();

    }
    anim() {

        switch (this.pivot(true)) {
            case 'Front':
                this.animationManager?.playAnimation('fall', true);
                break;
            case 'Left':
                this.animationManager?.playAnimation('fallLeft', true) || this.animationManager?.playAnimation('fall', true);
                break;
            case 'Right':
                this.animationManager?.playAnimation('fallRight', true)|| this.animationManager?.playAnimation('fall', true);
                break;
            case 'Back':
                this.animationManager?.playAnimation('fallBwd', true)|| this.animationManager?.playAnimation('fall', true);
                break;
            default:
                this.animationManager?.playAnimation('fall', true);
        }
    }
}