export default class RunBoost {
    constructor(actor) {
        this.actor = actor;
        this.body = actor.body;
        this.runBoost = 0;
        this.maxRunBoost = 5000;
    }

    update(dt, state, wishdir) {
        if (state === 'run') {
            this.runBoost = Math.min(this.runBoost + 10 * dt, this.maxRunBoost);
            //const alignment = wishdir.clone().

        } else {
            this.runBoost = Math.max(this.runBoost - 5 * dt, 0);
        }
    }

    getRunBoost() {
        return this.runBoost;
    }
}