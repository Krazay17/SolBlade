import PlayerState from "./_PlayerState";

export default class StunState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.reEnter = true;
        this.timer = 0;
    }
    enter(duration = 1000) {
        this.timer = performance.now() + duration;
        this.actor.animator?.setAnimState('knockback', true);
    }
    update(dt) {
        console.log(this.timer);
        if (this.timer > performance.now()) return;
        this.manager.setState('idle');
    }

    canExit(stance) {
        return this.timer < performance.now() || stance === 'stun';
    }
}