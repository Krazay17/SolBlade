import Actor from "../actors/Actor.js";
import { Physics } from "./Physics.js";

export default class SolWorld {
    /**@type {Map<string, Actor>} */
    actors = new Map();
    /**
     * 
     * @param {String} name 
     */
    constructor(name) {
        this.name = name;

        this.localPlayer = null;
        this.physics = new Physics();

        this.players = new Map();
    }
    async start() { }
    step(dt) { }
    tick(dt) { }
    getState() {
        const data = [];
        this.actors.forEach((v, k) => {
            const obj = {
                id: v.id ?? 0,
                pos: v.pos,
                rot: v.rot,
                worldName: v.worldName,
                type: v.type,
                subtype: v.subtype,
            }
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
    newActor(data) {
        const { id, type } = data;
        const actor = new Actor({ id, ...data });
        this.actors.set(id, actor);
        actor.makeBody(this.physics.world);
        if (this.onNewActor) this.onNewActor(actor)
    }
    onNewActor(actor) { }
    exit() { }
}