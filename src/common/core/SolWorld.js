import Actor from "../actors/Actor.js";
import { spawnActor } from "./ActorFactory.js";
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
        this.loader = null;
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
    newActor(data) { }
    exit() { }
}