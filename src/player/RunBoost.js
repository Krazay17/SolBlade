export default class RunBoost {
    constructor(actor) {
        this.actor = actor;
        this.body = actor.body;
        this.runBoost = 0;
        this.maxRunBoost = 5000;

    }

    update(dt, state) {
        this.applyFriction(dt);
        if (state === 'run') {
            this.runBoost = Math.min(this.runBoost + 10 * dt, this.maxRunBoost);
        }
    }

    applyFriction(dt) {
        this.runBoost = Math.max(this.runBoost - 5 * dt, 0);
    }
}