import { io } from "../server.js";

export default class SvEnergy {
    constructor(actor, max) {
        this.actor = actor;
        this.max = max;
        this._current = max;
    }
    get current() { return this._current }
    set current(value) {
        const clamped = Math.max(0, Math.min(this.max, value));
        if (clamped === this._current) return;
        this._current = clamped;
        //io.emit('actorEvent', { id: this.actor.netId, event: 'addEnergy', data: value });
    }
    add(value) {
        this.current = this._current + value;
        io.emit('actorEvent', { id: this.actor.netId, event: 'addEnergy', data: value });
    }
}