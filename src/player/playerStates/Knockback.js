import PlayerState from "./_PlayerState";

export default class KnockbackState extends PlayerState {
    enter(state, params = {}) {
        this.actor.animator?.setAnimState('knockback', true, true);
        this.actor.movement.fallStart();
        this.enterTime = performance.now();
        this.duration = params.dur || 300; // Minimum time to be in knockback state before allowing transitions
    }
    update(dt) {
        this.actor.movement.airMove(dt);

        if (performance.now() - this.enterTime > this.duration) {
            this.manager.setState('idle');
            return;
        }
    }
}