import PlayerState from "./_PlayerState";

export default class StunState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.reEnter = true;
    }
    enter({ type, dir, duration = 700 }) {
        this.timer = performance.now() + duration;
        this.actor.animator?.setAnimState(type);
    }
    update(dt) {
        if (this.timer > performance.now()) return;
        this.manager.setState('idle');
        return;
    }

    canExit(state) {
        return this.timer < performance.now() || state === 'stun' || state === 'dead';
    }
}