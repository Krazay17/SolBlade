import Player from "../player/Player";
import MyEventEmitter from "./MyEventEmitter";

export default class Energy {
    constructor(owner, maxEnergy = 100, baseRegen = 50) {
        /**@type {Player} */
        this.owner = owner;
        this.max = maxEnergy;
        this.current = maxEnergy;
        this._baseRegenRate = baseRegen;
        this.regenRate = baseRegen;
        this.drainRate = 0;
        this.canRegen = true;
        this.regenDelay = 1500;
        this._regenTimeout = null;
    }
    get baseRegenRate() { return this._baseRegenRate }
    update(dt) {
        if (this.drainRate > 0) return this._applyDrain(dt);
        if (this.canRegen && this.regenRate > 0) this._applyRegen(dt);
    }

    _applyRegen(dt) {
        this.current += this.regenRate * dt;
        this._clamp();
    }

    _applyDrain(dt) {
        this.current -= this.drainRate * dt;
        this._clamp();
    }

    tryUse(amount) {
        if (this.current < amount) return false;
        this.current -= amount;
        this._clamp();
        this._delayRegen();
        return true;
    }

    add(amount) {
        this.current += amount;
        this._clamp();
    }

    _delayRegen() {
        this.canRegen = false;
        clearTimeout(this._regenTimeout);
        this._regenTimeout = setTimeout(() => (this.canRegen = true), this.regenDelay);
    }

    _clamp() {
        if (this.current > this.max) this.current = this.max;
        if (this.current < 0) this.current = 0;
        MyEventEmitter.emit('updateEnergy', this.current);
    }

}