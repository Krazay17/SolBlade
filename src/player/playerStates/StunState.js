import PlayerState from "./_PlayerState";

export default class StunState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.reEnter = true;
        this.timer = 0;
    }
    enter({ stun = 500, dim = 0 } = {}) {
        this.timer = performance.now() + stun;
        this.actor.setDimmed(dim);
        this.actor.animator?.setAnimState('knockback', true);
    }
    update(dt) {
        if (this.timer > performance.now()) return;
        this.manager.setState('idle');
    }

    canExit(stance) {
        return this.timer < performance.now() || stance === 'stun' || stance === 'dead';
    }
}