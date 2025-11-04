import { randomUUID } from "crypto";
import { randomPos } from "@solblade/shared";
import SPlayer from "../newactors/SPlayer.js";
import SActor from "../newactors/SActor.js";
import SPower from "../newactors/SPower.js";


const actorRegistry = {
    player: SPlayer,
    power: SPower,
}

export default class SActorManager {
    constructor(game, io) {
        this.game = game;
        this.io = io;

        this._actors = [];
        this.actorsOfScene = {
            'scene0': { players: [], enemies: [], others: [] },
            'scene1': { players: [], enemies: [], others: [] },
            'scene2': { players: [], enemies: [], others: [] },
            'scene3': { players: [], enemies: [], others: [] },
            'scene4': { players: [], enemies: [], others: [] },
        };

        this.hasSpawnedDefaults = false;
        setImmediate(() => this.spawnDefaultActors());

        SActorManager.instance = this;
    }
    static getInstance(io) {
        if (SActorManager.instance) return SvActorManager.instance;
        else {
            if (!io) throw console.error('Create ActorManager with io first!');
            SActorManager.instance = new SActorManager(io);
            return SActorManager.instance;
        }
    }
    get actors() { return this._actors }
    get enemies() { return this.actors.filter(a => a.type === 'enemy') }

    update(dt) {
        for (const a of this.actors) { a.update?.(dt) }
    }
    getActorsOfScene(scene) {
        const data = [
            ...this.actorsOfScene[scene].players,
            ...this.actorsOfScene[scene].enemies,
            ...this.actorsOfScene[scene].others,
        ];

        const serializedData = [];
        for (const a of data) {
            if (!a.active) continue;
            serializedData.push(a.serialize());
        }
        return serializedData;
    }
    getActorById(id) {
        /**@type {SActor} */
        return this.actors.find(a => a.id === id);
    }
    updateActor(actor, data) {
        actor = typeof actor === 'string' ? this.getActorById(actor) : actor;
    }
    onNewScene(actor, scene) {
        actor = typeof actor === 'string' ? this.getActorById(actor) : actor;
        if (actor && (actor.sceneName !== scene)) {
            const indx = this.actorsOfScene[actor.sceneName].players.indexOf(actor);
            this.actorsOfScene[actor.sceneName].players.splice(indx, 1);
            actor.sceneName = scene;
            if (!this.actorsOfScene[actor.sceneName].players.includes(actor)) this.actorsOfScene[actor.sceneName].players.push(actor);
        }
    }
    removeActor(actor) {
        actor = typeof actor === 'string' ? this.getActorById(actor) : actor;
        if (!actor) return;
        const index = this.actors.indexOf(actor);
        this.actors.splice(index, 1);
        switch (actor.type) {
            case 'player':
                this.actorsOfScene[actor.sceneName].players.splice(this.actorsOfScene[actor.sceneName].players.indexOf(actor), 1);
                break;
            case 'enemy':
                this.actorsOfScene[actor.sceneName].enemies.splice(this.actorsOfScene[actor.sceneName].enemies.indexOf(actor), 1);
                break;
            default:
                this.actorsOfScene[actor.sceneName].others.splice(this.actorsOfScene[actor.sceneName].others.indexOf(actor), 1);
                break;
        }
    }
    createActor(type, data) {
        let actor;

        const id = type === 'player' && data.id
            ? data.id
            : randomUUID();
        const actorClass = actorRegistry[type];
        if (actorClass) {
            actor = new actorClass(this, { ...data, type, id: id });
        } else {
            actor = new SActor(this, { ...data, type, id: id });
        }
        if (!actor) return;
        if (!this.actorsOfScene[actor.sceneName]) {
            this.actorsOfScene[actor.sceneName] = { players: [], enemies: [], others: [] };
        }
        switch (type) {
            case 'player':
                this.actorsOfScene[actor.sceneName].players.push(actor);
                break;
            case 'enemy':
                this.actorsOfScene[actor.sceneName].enemies.push(actor);
                break;
            default:
                this.actorsOfScene[actor.sceneName].others.push(actor);
                break;
        }
        this.actors.push(actor);
        this.io.emit('newActor', actor.serialize());
        return actor;
    }
    spawnDefaultActors() {
        if (this.hasSpawnedDefaults) return;
        this.hasSpawnedDefaults = true;
        const item = 4;
        const power = 5;
        const enemies = 4;
        // for (let i = 0; i < item; i++) {
        //     this.createActor('item', { scene: 'scene2', pos: randomPos(20, 10) });
        // }
        for (let i = 0; i < power; i++) {
            const powerType = i % 2 ? 'health' : 'energy';
            this.createActor('power', { scene: 'scene2', power: powerType, pos: randomPos(20, 10) });
        }
        // for (let i = 0; i < enemies; i++) {
        //     this.createActor('enemy', { enemy: 'julian', scene: 'scene3', pos: randomPos(25, 15) });
        // }
        // setInterval(() => {
        //     if (this.actorsOfScene['scene3'].enemies.length > 12) return;
        //     this.createActor('enemy', { enemy: 'julian', scene: 'scene3', pos: randomPos(25, 15) });
        // }, 2000)

        // for (let i = 0; i < enemies; i++) {
        //     this.createActor('enemy', { enemy: 'julian', scene: 'scene4', pos: randomPos(100, 15) });
        // }
        // setInterval(() => {
        //     if (this.actorsOfScene['scene4'].enemies.length > 12) return;
        //     this.createActor('enemy', { enemy: 'julian', scene: 'scene4', pos: randomPos(100, 15) });
        // }, 2000)
    }
}