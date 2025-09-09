import PlayerState from "./_PlayerState";

export default class JumpState extends PlayerState {
    enter() {
        this.actor.animator?.setAnimState('jump');
        this.jumpTimer = performance.now() + 380;

        this.actor.movement.jumpStart();
    }
    update(dt) {
        this.actor.movement.airMove(dt);

        if (this.jumpTimer < performance.now()) {
            this.manager.setState('idle');
            return;
        }
    }
}