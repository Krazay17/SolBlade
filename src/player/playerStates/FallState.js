import PlayerState from "./_PlayerState";

export default class FallState extends PlayerState {
    enter() {
        this.actor.animator?.setAnimState('fall');
    }
    update(dt) {
        this.airMove(dt);
        if (this.input.keys['ShiftLeft'] && this.manager.tryDash()) {
            return;
        }
        const floor = this.actor.floorTrace();
        if (floor > 0.7) {
            this.actor.setState('idle', floor);
            return;
        }
    }
}