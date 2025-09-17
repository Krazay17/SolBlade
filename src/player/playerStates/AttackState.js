import PlayerState from "./_PlayerState";

export default class AttackState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.weapon = null;
    }
    enter(state, { weapon, anim, damageDelay = 0, damageDuration = 300, duration = 610, doesParry = false, callback = null }) {
        this.weapon = weapon;
        this.exitTimer = performance.now() + duration;
        this.actor.animator?.setAnimState(anim, true);
        this.damageDelay = performance.now() + damageDelay;
        this.damageDuration = damageDuration;
        this.doesParry = doesParry;
        this.callback = callback;
    }
    update(dt) {
        this.actor.movement.attackMove(dt);

        if ((performance.now() > this.damageDelay) && (performance.now() < this.damageDelay + this.damageDuration)) {
            if (this.weapon) this.weapon.update();
            if (this.callback) this.callback();
            this.callback = null;
            if (this.doesParry) {
                this.actor.setParry(true);
            }
        } else {
            this.actor.setParry(false);
        }

        if (performance.now() > this.exitTimer) {
            this.actor.stateManager.setState('idle');
        }
    }
    exit(state) {
        if (state !== 'parry') {
            this.actor.setParry(false);
        }
    }
    canExit(state) {
        return performance.now() > this.exitTimer
            || state === 'dead'
            || state === 'stun'
            || state === 'parry';
    }
}