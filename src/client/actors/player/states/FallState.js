import State from "./_PlayerState";

export default class FallState extends State {
    update(dt) {
        if (this.movement.groundChecker.isGrounded()) return this.setState('idle');
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