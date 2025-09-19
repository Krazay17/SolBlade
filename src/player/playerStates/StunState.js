import PlayerState from "./_PlayerState";

export default class StunState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.reEnter = true;
        this.timer = 0;
    }
    enter(state, { stun = 500, anim } = {}) {
        this.timer = performance.now() + stun;
        if (anim) {
            this.actor.animator?.setAnimState(anim, true);
        }
    }
    update(dt) {
        if (this.timer > performance.now()) return;
        this.manager.setState('idle');
    }

    canExit(stance) {
        return this.timer < performance.now() || stance === 'stun' || stance === 'dead';
    }
}