import Input from "../../core/Input";
import PlayerState from "./_PlayerState";

export default class RunState extends PlayerState {
    enter() {
        this.grounded = true;
    }
    update(dt) {
        this.actor.movement.groundMove(dt);
        const animScale = 1 + this.movement.momentumBooster?.getBoost() / 20;
        this.actor.energy.regenRate = this.actor.energy.baseRegenRate;

        this.actor.animationManager?.changeTimeScale(animScale, 2);

        if (!this.grounded) {
            this.manager.setState('fall');
            return;
        }
        if (this.movement.getInputDirection().length() === 0) {
            this.manager.setState('idle');
            return;
        }
        switch (this.pivot(false)) {
            case 'Front':
                this.animationManager.playAnimation('run');
                break;
            case 'Back':
                this.animationManager.playAnimation('runBwd');
                break;
            case 'Left':
                this.animationManager.playAnimation('strafeLeft');
                break;
            case 'Right':
                this.animationManager.playAnimation('strafeRight');
                break;
            default:
                this.animationManager.playAnimation('run');

        }
        if (!this.movement.isGrounded()) {
            if (!this.floorTimer) {
                this.floorTimer = setTimeout(() => {
                    this.floorTimer = null;
                    this.grounded = false;
                }, 200);
            }
        } else {
            clearTimeout(this.floorTimer);
            this.floorTimer = null;
            if (!this.grounded) {
                // do once on landing
            }

            this.grounded = true;
        }

    }
}