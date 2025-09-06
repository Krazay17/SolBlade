import { Vec3 } from "cannon";

export default class MomentumBoost {
    constructor(actor) {
        this.actor = actor;
        this.body = actor.body;
        this.input = actor.input;
        this.boostAmount = 0;
        this.lastVelocity = new Vec3();
        this.lastAlignment = 0;
        this.lastSpeed = 0;
        this.misAlign = 0;

        this.alignmentLax = 0;
        this.maxRunBoost = 4;

    }
    getalignment(currentVelocity) {
        this.lastAlignment = Math.max(0, Math.min(1, currentVelocity.dot(this.lastVelocity)));

        this.lastVelocity = currentVelocity.clone();
        return Math.pow(this.lastAlignment, 50);
    }
    increaseBoost(amount, max = this.maxRunBoost) {
        if (this.boostAmount < this.boostAmount + amount) {
            this.boostAmount = Math.min(max, this.boostAmount + amount);
        }
        return this.boostAmount;
    }
    decreaseBoost(amount) {
        this.boostAmount -= amount;
        if (this.boostAmount < 0) this.boostAmount = 0;
        return this.boostAmount;
    }
    update(dt, velocity) {
        const currentVelocity = velocity.clone();
        currentVelocity.y = 0;
        currentVelocity.normalize();
        if (currentVelocity.length() < this.lastSpeed) {
            this.boostAmount *= 0.98;
        }
        const currentAlignment = this.getalignment(currentVelocity);
        this.boostAmount *= currentAlignment;

    }

    setBoost(amount) {
        this.boostAmount = amount;
    }

    getBoost() {
        return this.boostAmount;
    }
}