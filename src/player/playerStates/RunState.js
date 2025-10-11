import Input from "../../core/Input";
import PlayerState from "./_PlayerState";

export default class RunState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
    }
    enter() {
        this.grounded = true;
    }
    update(dt) {
        /**@type {Input} */
        const input = this.input;

        this.actor.movement.groundMove(dt);
        const animScale = 1 + this.movement.momentumBooster.getBoost() / 20;

        this.actor.animationManager?.changeTimeScale(animScale, 2);

        if (!this.grounded) {
            this.manager.setState('fall');
            return;
        }
        if (this.movement.getInputDirection().length() === 0) {
            this.manager.setState('idle');
            return;
        }
        if (input.actionStates.jump && this.grounded
            && this.manager.setState('jump')) {
            return;
        }

        let strafe = true;
        if (input.actionStates.moveForward) {
            strafe = false;
            this.actor.animationManager?.playAnimation('run');
        }
        if (input.actionStates.moveBackward) {
            strafe = false;
            this.actor.animationManager?.playAnimation('run');
        }
        if (input.actionStates.moveLeft) {
            if (strafe) {
                this.actor.animationManager?.playAnimation('strafeLeft');
            }
        }
        if (input.actionStates.moveRight) {
            if (strafe) {
                this.actor.animationManager?.playAnimation('strafeRight');
            }
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