import PlayerState from "./_PlayerState";

export default class BladeJumpState extends PlayerState {
    enter() {
        this.actor.animator?.setAnimState('jump', true);
        this.jumpTimer = performance.now() + 400;

        this.actor.movement.jumpStart(.333);
    }
    update(dt) {
        this.actor.movement.jumpMove(dt);

        if (this.jumpTimer < performance.now()) {
            if (this.input.actionStates.blade) {
                this.manager.setState('blade');
                return;
            } else {
                this.manager.setState('idle');
                this.actor.energyRegen = 25;
                return;
            }
        }
    }
    exit(state) {
        if (state === 'blade') return;
        this.actor.energyRegen = 25;
    }
}