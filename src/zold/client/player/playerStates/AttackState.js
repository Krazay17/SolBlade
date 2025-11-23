import PlayerState from "./_PlayerState";

export default class AttackState extends PlayerState {
    constructor(game, manager, actor, options = {}) {
        super(game, manager, actor, options);
        this.weapon = null;
    }
    enter(state, {
        weapon,
        duration = 610,
        onExit = null,
    } = {}) {
        this.weapon = weapon;
        this.exitTimer = performance.now() + duration;
        this.onExit = onExit;
    }
    update(dt) {
        this.movement.smartMove(dt);
        if (this.weapon) this.weapon.update(dt);

        if (performance.now() > this.exitTimer) {
            this.actor.stateManager.setState('idle');
        }
    }
    exit(state) {
        if (this.onExit) this.onExit();
    }
    canExit(state) {
        return performance.now() > this.exitTimer
            || state === 'dead'
            || state === 'stun'
            || state === 'parry';
    }
}