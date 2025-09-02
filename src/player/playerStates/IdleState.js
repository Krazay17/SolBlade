import PlayerState from "./_PlayerState";

export default class IdleState extends PlayerState {
    enter() {
        this.actor.animator?.setAnimState('idle');
    }
    update(dt) {
        this.actor.movement.idleMove(dt);
        
        if (!this.actor.movement.getInputDirection().isZero()) {
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

        if (!this.actor.groundChecker.isGrounded()) {
            this.manager.setState('fall');
            return;
        }
    }
    canEnter() {
        if (!this.actor.groundChecker.isGrounded()) {
            this.manager.setState('fall');
            return false;
        }
        if (!this.actor.movement.getInputDirection().isZero()) {
            this.manager.setState('run', this.actor.floorTrace());
            return false;
        }
        return true;
    }
}