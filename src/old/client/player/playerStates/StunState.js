import PlayerState from "./_PlayerState";

export default class StunState extends PlayerState {
    constructor(game, manager, actor, options = {}) {
        super(game, manager, actor, options);
        this.reEnter = true;
        this.timer = 0;
    }
    enter(state, { stun = 500, anim = "knockback" } = {}) {
        this.timer = performance.now() + stun;
        if (anim) {
            this.actor.animationManager?.playAnimation(anim, false);
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