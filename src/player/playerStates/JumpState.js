import PlayerState from "./_PlayerState";

export default class JumpState extends PlayerState {
    enter() {
        const anim = this.grounded ? 'jump' : 'jumpSpin';
        this.actor.animator?.setAnimState(anim, true);
        this.jumpTimer = performance.now() + 300;
        this.jumpCD = performance.now() + 500;

        this.actor.movement.jumpStart(.666);
        this.actor.movement.grounded = false;
    }
    update(dt) {
        this.actor.movement.jumpMove(dt);

        if (this.jumpTimer < performance.now()) {
            this.manager.setState('idle');
            return;
        }
    }
    canEnter() {
        this.grounded = this.actor.movement.isGrounded(.7);
        return (!this.jumpCD || this.jumpCD < performance.now())
            && ((this.grounded || this.actor.tryUseEnergy(50)));
    }
}