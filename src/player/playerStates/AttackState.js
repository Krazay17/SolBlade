import PlayerState from "./_PlayerState";

export default class AttackState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.weapon = null;
    }
    enter({ weapon, anim, damageDelay = 0, duration = 610 }) {
        this.weapon = weapon;
        this.exitTimer = performance.now() + duration;
        this.airFriction = 6;
        this.actor.animator?.setAnimState(anim);
        this.damageDelay = performance.now() + damageDelay;
    }
    update(dt) {
        this.actor.movement.attackMove(dt);

        if (performance.now() > this.damageDelay) {
            this.weapon.update();
        }

        if (performance.now() > this.exitTimer) {
            this.actor.stateManager.setState('idle');
        }
    }
}