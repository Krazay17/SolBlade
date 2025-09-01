import PlayerState from "./_PlayerState";

export default class FallState extends PlayerState {
    enter() {
        this.actor.animator?.setAnimState('fall');
    }
    update(dt) {
        this.airMove(dt);

        if (this.actor.groundChecker.isGrounded()) {
            this.manager.setState('idle');
            return;
        }
        if (this.input.actionStates.dash) {
            this.manager.setState('dash')
            return;
        }
    }
}