import { Vec3 } from "cannon";

export default class RunBoost {
    constructor(actor) {
        this.actor = actor;
        this.body = actor.body;
        this.input = actor.input;
        this.boostAmount = 0;
        this.lastVelocity = new Vec3();
        this.lastAlignment = 0;

        this.alignmentLax = 0;
        this.maxRunBoost = 5000;
        this.boostAccel = 5;
    }

    getalignment() {
        const currentVelocity = this.body.velocity.clone();
        if (currentVelocity.almostZero()) {
            return 0;
        } else {
            currentVelocity.y = 0;
            this.lastSpeed = currentVelocity.length();
            currentVelocity.normalize();
        }

        // const alignment = this.actor.getInputDirection().clone();
        // if (alignment.length() !== 0) {
        //     this.lastAlignment = Math.max(0, Math.min(1, alignment.dot(this.lastVelocity) + this.alignmentLax));
        // }
        this.lastAlignment = Math.max(0, Math.min(1, currentVelocity.dot(this.lastVelocity)));

        this.lastVelocity = currentVelocity.clone();
        return this.lastAlignment;
    }
    update(dt, state) {
        if (this.body.velocity.length() < this.lastSpeed) {
            this.boostAmount *= 0.98;
        }
        const currentAlignment = this.getalignment();
        let misAlign = Math.pow(currentAlignment, 25);
        if (state === 'run') {
            this.boostAmount = Math.min(this.maxRunBoost, this.boostAmount + this.boostAccel * misAlign * dt);
        }
        this.boostAmount *= misAlign;
    }

    getBoost() {
        return this.boostAmount;
    }
}