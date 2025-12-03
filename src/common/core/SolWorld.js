import Actor from "../actors/Actor.js";
import { Physics } from "./Physics.js";

export default class SolWorld {
    /**@type {Map<string, Actor>} */
    actors = new Map();
    /**@type {Map<string, Actor>} */
    players = new Map();
    /**
     * 
     * @param {String} name 
     */
    constructor(name) {
        this.name = name;

        this.localPlayer = null;
        this.physics = new Physics();
    }
    async start() { }
    step(dt) { }
    tick(dt) {
        this.actors.forEach((a) => {
            a.tick(dt);
        })
    }
    getState() {
        const data = [];
        this.actors.forEach((v, k) => {
            const obj = v.serialize();
            data.push(obj);
        })
        return data
    }
    updateState(data) {
        for (const d of data) {
            const { id, worldName, pos, rot, type } = d;
            if (id === this.localPlayer.id || worldName !== this.name) continue;
            const actor = this.actors.get(id);
            if (actor) {
                actor.pos = pos;
                actor.rot = rot;
            } else {
                this.newActor(d);
            }
        }
    }
    async newActor(data) {
        const { id, type } = data;
        const registry = await import("@solblade/server/core/ServerRegistry.js");
        const aclass = registry.serverActors[type];
        let actor;
        if (aclass) {
            actor = new aclass(this, { id, ...data });
        } else {
            actor = new Actor({ id, ...data });
        }
        this.actors.set(id, actor);
        actor.makeBody(this.physics.world);
        if (this.onNewActor) this.onNewActor(actor)
    }
    onNewActor(actor) { }
    exit() { }
}