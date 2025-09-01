import { Vec3 } from "cannon";

export default class RunBoost {
    constructor(actor) {
        this.actor = actor;
        this.body = actor.body;
        this.input = actor.input;
        this.boostAmount = 0;
        this.lastVelocity = new Vec3();
        this.lastAlignment = 0;
        this.lastSpeed = 0;

        this.alignmentLax = 0;
        this.maxRunBoost = 5000;
        this.boostAccel = 10;
    }
    getalignment() {
        const currentVelocity = this.body.velocity.clone();
        currentVelocity.y = 0;
        currentVelocity.normalize();

        //const alignment = this.actor.getInputDirection().clone();

        this.lastAlignment = Math.max(0, Math.min(1, currentVelocity.dot(this.lastVelocity)));

        this.lastVelocity = currentVelocity.clone();
        return this.lastAlignment;
    }
    update(dt, state) {
        const currentVelocity = this.body.velocity.clone();
        currentVelocity.y = 0;
        currentVelocity.normalize();
        if (currentVelocity.length() < this.lastSpeed) {
            this.boostAmount *= 0.98;
        }
        const currentAlignment = this.getalignment();
        let misAlign = Math.pow(currentAlignment, 11);
        if (state === 'run'|| state === 'blade') {
            this.boostAmount = Math.min(this.maxRunBoost, this.boostAmount + this.boostAccel * misAlign * dt);
        }
        this.boostAmount *= misAlign;

        this.lastSpeed = currentVelocity.length();
    }

    setBoost(amount) {
        this.boostAmount = amount;
    }

    getBoost() {
        return this.boostAmount;
    }
}