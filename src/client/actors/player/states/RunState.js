import State from "./_PlayerState";

export default class RunState extends State {
    update(dt) {
        if (!this.movement.groundChecker.isGrounded()) return this.setState('fall');
        const dir = this.controller.inputDirection();
        if (!dir) return this.setState('idle');
        this.movement.smartMove(dt, dir);
        const animScale = 1 + this.movement.momentum?.getBoost() / 20;
        this.animation.changeTimeScale(animScale);

        switch (this.pivot()) {
            case "Front":
                this.animation.playAnimation('run');
                break;
            case 'Back':
                this.animation.playAnimation('runBwd');
                break;
            case 'Left':
                this.animation.playAnimation('strafeLeft');
                break;
            case 'Right':
                this.animation.playAnimation('strafeRight');
                break;
            default:
                this.animation.playAnimation('run');
        }
    }
}