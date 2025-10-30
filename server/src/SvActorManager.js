import { randomUUID } from "crypto";
import actorDefaults, { randomPos } from "./ActorDefaults.js";
import SrvEnemy from "./actors/SvEnemy.js";
import SvServerPhysics from "./SvPhysics.js";
import SrvPlayer from "./actors/SvPlayer.js";
import SvActor from "./actors/SvActor.js";
import SvPower from "./actors/SvPower.js";
import SvCard from "./actors/SvCard.js";

const actorRegistry = {
    player: SrvPlayer,
    enemy: SrvEnemy,
    power: SvPower,
    item: SvCard,
}

export default class SvActorManager {
    constructor(io) {
        this._actors = [];
        this.io = io;
        this.physics = new SvServerPhysics(this.io, this);
        this.actorsOfWorld = {
            'world1': { players: [], enemies: [], others: [] },
            'world2': { players: [], enemies: [], others: [] },
            'world3': { players: [], enemies: [], others: [] },
            'world4': { players: [], enemies: [], others: [] },
        };

        this.hasSpawnedDefaults = false;
        setImmediate(() => this.spawnDefaultActors());

        this.lastTime = Date.now();
        this.updateEnemies()
        this.actorTick = setInterval(() => {
            let dt = (Date.now() - this.lastTime) / 1000;
            this.lastTime = Date.now();
            this.updateEnemies(dt);
        }, 1000 / 20);

        SvActorManager.instance = this;
    }
    static getInstance(io) {
        if (SvActorManager.instance) return SvActorManager.instance;
        else {
            if (!io) throw console.error('Create ActorManager with io first!');
            SvActorManager.instance = new SvActorManager(io);
            return SvActorManager.instance;
        }
    }
    get actors() { return this._actors }
    get enemies() { return this.actors.filter(a => a.type === 'enemy') }

    getActorsOfWorld(world) {
        let data = [];
        for (const a of this.actors) {
            if (!a.active) continue;
            if (a.solWorld !== world) continue;
            if (!this.remainingDuration(a)) continue;
            data.push(a.serialize());
        }
        return data;
    }
    getActorById(id) {
        /**@type {SvActor} */
        return this.actors.find(a => a.netId === id);
    }
    updateActor(data) {
        const actor = this.getActorById(data.netId);
        if (actor.solWorld !== data.solWorld) {
            const indx = this.actorsOfWorld[actor.solWorld].players.indexOf(actor);
            this.actorsOfWorld[actor.solWorld].players.splice(indx, 1);
            actor.solWorld = data.solWorld;
            this.actorsOfWorld[actor.solWorld].players.push(actor);
        }
    }
    removeActor(actor) {
        actor = typeof actor === 'string' ? this.getActorById(actor) : actor;
        if (!actor) return;
        const index = this.actors.indexOf(actor);
        this.actors.splice(index, 1);
        switch (actor.type) {
            case 'player':
                this.actorsOfWorld[actor.solWorld].players.splice(this.actorsOfWorld[actor.solWorld].players.indexOf(actor), 1);
                break;
            case 'enemy':
                this.actorsOfWorld[actor.solWorld].enemies.splice(this.actorsOfWorld[actor.solWorld].enemies.indexOf(actor), 1);
                break;
            default:
                this.actorsOfWorld[actor.solWorld].others.splice(this.actorsOfWorld[actor.solWorld].others.indexOf(actor), 1);
                break;
        }
    }
    createActor(type, data) {
        const id = type === 'player' && data.netId
            ? data.netId
            : randomUUID();
        const actorClass = actorRegistry[type];
        let actor;
        if (actorClass) {
            actor = new actorClass(this, { ...data, type, netId: id });
        } else {
            actor = new SvActor(this, { ...data, type, netId: id });
        }
        if (!actor.solWorld) {
            console.warn(`Actor ${actor.netId} created without solWorld! Defaulting to 0`);
            actor.solWorld = '0';
        }
        if (!this.actorsOfWorld[actor.solWorld]) {
            this.actorsOfWorld[actor.solWorld] = { players: [], enemies: [], others: [] };
        }
        switch (type) {
            case 'player':
                this.actorsOfWorld[actor.solWorld].players.push(actor);
                break;
            case 'enemy':
                this.actorsOfWorld[actor.solWorld].enemies.push(actor);
                break;
            default:
                this.actorsOfWorld[actor.solWorld].others.push(actor);
                break;
        }
        this.actors.push(actor);
        this.io.emit('newActor', actor.serialize());
        return actor;
    }
    spawnDefaultActors() {
        if (this.hasSpawnedDefaults) return;
        this.hasSpawnedDefaults = true;
        const item = 6;
        const power = 12;
        const enemies = 4;
        for (let i = 0; i < item; i++) {
            this.createActor('item', { solWorld: 'world2', pos: randomPos(20, 10) });
        }
        for (let i = 0; i < power; i++) {
            const powerType = i % 2 ? 'health' : 'energy';
            this.createActor('power', { solWorld: 'world2', power: powerType, pos: randomPos(20, 10) });
        }
        for (let i = 0; i < enemies; i++) {
            this.createActor('enemy', { enemy: 'julian', solWorld: 'world3', pos: randomPos(25, 15) });
        }
        setInterval(() => {
            if (this.actorsOfWorld['world3'].enemies.length > 20) return;
            this.createActor('enemy', { enemy: 'julian', solWorld: 'world3', pos: randomPos(25, 15) });
        }, 500)

        for (let i = 0; i < enemies; i++) {
            this.createActor('enemy', { enemy: 'julian', solWorld: 'world4', pos: randomPos(100, 15) });
        }
        setInterval(() => {
            if (this.actorsOfWorld['world4'].enemies.length > 25) return;
            this.createActor('enemy', { enemy: 'julian', solWorld: 'world4', pos: randomPos(100, 15) });
        }, 5000)
    }
    remainingDuration(actor) {
        const time = actor.time;
        const dur = actor.data.dur;
        if (!dur) return true;
        const active = performance.now() - time < dur;
        if (active) {
            return true;
        } else {
            this.removeActor(actor);
        }
        return active;
    }
    updateEnemies(dt) {
        for (const a of this.actors) { a.update?.(dt) }
    }

}