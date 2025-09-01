import PlayerState from "./_PlayerState";

export default class IdleState extends PlayerState {
    enter() {
        this.actor.animator?.setAnimState('idle');
    }
    update(dt) {
        this.applyFriction(dt, 25);
        if (this.isTryingToMove()) {
            this.manager.setState('run', this.actor.floorTrace());
            return;
        }

        if (this.input.keys['Space']) {
            this.manager.setState('jump');
            return;
        }

        if (this.input.actionStates.blade) {
            this.manager.setState('blade')
            return;
        }
        if (this.input.actionStates.dash) {
            this.manager.setState('dash');
            return;
        }

        if (!this.actor.floorTrace()) {
            this.manager.setState('fall');
            return;
        }
    }
    canEnter() {
        if (!this.actor.groundChecker.isGrounded()) {
            this.manager.setState('fall');
            return false;
        }
        if (this.isTryingToMove()) {
            this.manager.setState('run');
            return false;
        }
        return true;
    }
}