import { io } from "../server.js";
import { randomPos } from "../ActorDefaults.js";
import ActorManager from "../SvActorManager.js";
import SvHealth from "../SvHealth.js";

export default class SvActor {
    constructor(actorManager, data = {
        netId: '',
        type: '',
        name: '',
        solWorld: 'world0',
        pos: { x: 0, y: 1, z: 0 },
        rot: { x: 0, y: 0, z: 0, w: 1 },
    }) {
        /**@type {ActorManager} */
        this.actorManager = actorManager;
        this.data = data;

        this.netId = data.netId;
        this.type = data.type;
        this.name = data.name;
        this.solWorld = data.solWorld;
        this.pos = data.pos;
        this.rot = data.rot;

        this.ownerId = data.owner;

        this._active = true;
        this.isDead = false;
        this.spawnTime = performance.now();
        this.duration = data.dur;

        this.healthC = new SvHealth(this, data.maxHealth, data.health);
        this.healthC.onDeath = () => this.die();
        this.healthC.onChange = (val) => this.data.health = val;

        this.lastHit = null;
    }
    get active() {
        if (!this._active) return false;
        if (this.duration && (performance.now() > this.spawnTime + this.duration)) return false;
        return true;
    }
    set active(a) { this._active = a }
    serialize() {
        const data = {
            ...this.data,
            netId: this.netId,
            type: this.type,
            name: this.name,
            solWorld: this.solWorld,
            pos: this.pos,
            rot: this.rot,
        }
        return data;
    }
    hit(data) {
        this.healthC.subtract(data.amount);
        this.lastHit = data;
        io.emit('actorHit', data);
    }
    die(data) {
        this.active = false;
        io.emit('actorDie', { id: this.netId, data: data || this.lastHit });
    }
    destroy() {
        this.actorManager.removeActor(this);
    }
    respawn(time, pos) {
        if (!pos) pos = randomPos(20, 10);
        setTimeout(() => {
            this.actorManager.createActor(this.type, { ...this.data, pos });
        }, time);
    }
}