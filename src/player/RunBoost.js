import { Vec3 } from "cannon";

export default class RunBoost {
    constructor(actor) {
        this.actor = actor;
        this.body = actor.body;
        this.input = actor.input;
        this.boostAmount = 0;
        this.lastVelocity = new Vec3(0, 0, 0);
        this.lastAlignment = 0;

        this.alignmentLax = .1;
        this.maxRunBoost = 5000;
        this.boostAccel = 5;
    }

    getalignment() {
        const alignment = this.actor.getInputDirection().clone();
        if (alignment.length() !== 0) {
            this.lastAlignment = Math.max(0, Math.min(1, alignment.dot(this.lastVelocity) + this.alignmentLax));
        }
        this.lastVelocity = this.body.velocity.clone();
        this.lastVelocity.y = 0;
        this.lastVelocity.normalize();
        return this.lastAlignment || 0;
    }
    update(dt, state) {
        if(this.body.velocity.length() < 6) {
            this.boostAmount = Math.max(0, this.boostAmount - this.boostAccel * 20 * dt);
            return;
        }
        const currentAlignment = this.getalignment();
        if (state === 'run') {
            this.boostAmount = Math.min(this.boostAmount + this.boostAccel * dt * currentAlignment, this.maxRunBoost);
        } else {
            this.boostAmount = Math.max(0, (this.boostAmount - (1 - currentAlignment) * this.boostAccel * 10 * dt));
        }
    }

    getBoost() {
        return this.boostAmount;
    }
}