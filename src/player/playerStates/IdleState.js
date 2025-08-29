import PlayerState from "./_PlayerState";

export default class IdleState extends PlayerState {
    enter(floor) {
        if (!floor) {
            this.actor.setState('fall');
            return;
        } else {
            if(floor <= .7) {
                this.actor.setState('fall');
                return;
            }
        }
        if (this.isTryingToMove()) {
            this.actor.setState('run', floor);
            return;
        }
        this.actor.animator?.setAnimState('idle');
    }
    update(dt) {
        this.applyFriction(dt, 25);
        if (this.isTryingToMove()) {
            this.actor.setState('run', this.actor.floorTrace());
            return;
        }

        if (this.input.keys['Space']) {
            this.actor.setState('jump');
            return;
        }
        if (this.input.keys['ShiftLeft'] && this.manager.tryDash()) {
            return;
        }

        if (!this.actor.floorTrace()) {
            this.actor.setState('fall');
            return;
        }
    }
}