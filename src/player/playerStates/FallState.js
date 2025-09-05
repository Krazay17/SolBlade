import PlayerState from "./_PlayerState";

export default class FallState extends PlayerState {
    enter() {
        this.actor.animator?.setAnimState('fall');
    }
    update(dt) {
        this.actor.movement.airMove(dt);

        if(this.input.actionStates.blade && this.actor.groundChecker.isGrounded(.1)) {
            this.manager.setState('blade');
            return;
        }

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