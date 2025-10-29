import { io } from "../server.js";

export default class SvHealth {
    constructor(actor, maxHealth = 1, current) {
        this.actor = actor;
        this.maxHealth = maxHealth;
        this._current = current ?? maxHealth;

        this.onChange = null;
        this.onDeath = null;
    }
    get current() { return this._current; }
    set current(value) {
        // Clamp between 0 and maxHealth
        const clamped = Math.max(0, Math.min(this.maxHealth, value));
        if (clamped === this._current) return;

        this._current = clamped;

        // Notify listeners
        if (this.onChange) this.onChange(this._current);
        io.emit('actorHealthChange', { id: this.actor.netId, health: this.current });

        // Death callback
        if (this._current <= 0 && this.onDeath) {
            this.onDeath();
        }
    }
    add(value) { this.current = this._current + value; }

    subtract(value) { this.current = this._current - value; }
}
