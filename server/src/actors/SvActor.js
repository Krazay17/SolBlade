import { io } from "../../server.js";
import { randomPos } from "../ActorDefaults.js";
import ActorManager from "../SvActorManager.js";
import SvHealth from "../SvHealth.js";

export default class SvActor {
    constructor(actorManager, data = {
        netId: '',
        type: '',
        name: '',
        solWorld: '0',
        pos: { x: 0, y: 1, z: 0 },
    }) {
        /**@type {ActorManager} */
        this.actorManager = actorManager;
        this.data = data;

        this.netId = data.netId;
        this.type = data.type;
        this.name = data.name;
        this.solWorld = data.solWorld;
        this.pos = data.pos;

        this.active = true;

        this.healthC = new SvHealth(this, data.maxHealth, data.health);
        this.healthC.onDeath = () => this.die();

        this.lastHit = null;
    }
    serialize() {
        const data = {
            ...this.data,
            netId: this.netId,
            type: this.type,
            name: this.name,
            solWorld: this.solWorld,
            pos: this.pos,
        }
        return data;
    }
    hit(data) {
        this.healthC.subtract(data.amount);
        this.lastHit = data;
        io.emit('actorHit', data);
    }
    die() {
        this.active = false;
        io.emit('actorDie', { id: this.netId, data: this.lastHit });
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