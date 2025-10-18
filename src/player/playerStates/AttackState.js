import PlayerState from "./_PlayerState";

export default class AttackState extends PlayerState {
    constructor(game, manager, actor,options = {}) {
        super(game, manager, actor,options);
        this.weapon = null;
    }
    enter(state, {
        weapon,
        anim,
        damageDelay = 0,
        damageDuration = 300,
        duration = 610,
        doesParry = false,
        callback = null,
        friction = null,
        speed = null,
    } = {}) {
        this.weapon = weapon;
        this.exitTimer = performance.now() + duration;
        this.animationManager?.playAnimation(anim, false);
        this.damageDelay = performance.now() + damageDelay;
        this.damageDuration = damageDuration;
        this.doesParry = doesParry;
        this.callback = callback;
        this.frictionOverride = friction;
        this.speedOverride = speed;
    }
    update(dt) {
        //this.actor.movement.attackMove(dt, this.frictionOverride, this.speedOverride);
        if(this.movement.isGrounded()) {
            this.movement.groundMove(dt);
            //this.actor.animationManager.playAnimation('BlendWalk');
        } else {
            this.movement.airMove(dt);
        }
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