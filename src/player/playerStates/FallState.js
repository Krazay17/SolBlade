import PlayerState from "./_PlayerState";

export default class FallState extends PlayerState {
    enter() {
        this.actor.animator?.setAnimState('fall');
        this.actor.movement.fallStart();
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
    }
}