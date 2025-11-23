import PlayerState from "./_PlayerState";

export default class JumpState extends PlayerState {
    enter() {
        const anim = this.grounded ? 'jump' : 'frontFlip';
        this.actor.animationManager?.playAnimation(anim, false);
        this.jumpTimer = performance.now() + 550;
        this.jumpCD = performance.now() + 440;

        this.actor.movement.jumpStart(4);
        this.actor.movement.grounded = false;
    }
    update(dt) {
        if (performance.now() < this.jumpTimer - 150) {
            this.actor.movement.jumpMove(dt, this.grounded ? 6 : 10);
        } else {
            this.actor.movement.airMove(dt);
            if (!this.input.actionStates.jump) this.manager.setState('idle');
        }

        if (performance.now() > this.jumpTimer) {
            this.manager.setState('idle');
            return;
        }
    }
    canEnter() {
        this.grounded = this.actor.movement.isGrounded(.7);
        return (!this.jumpCD || this.jumpCD < performance.now())
            && this.stateManager.currentStateName !== 'blade'
            && ((this.grounded || this.actor.energy.tryUse(this.actor.doubleJumpCost)
            ));
    }
}