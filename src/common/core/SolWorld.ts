import { Actor } from "../actors/Actor.js";
import { Physics } from "./Physics.js";

export default class SolWorld {
    actors: Map<string, Actor> = new Map();
    players: Map<string, Actor> = new Map();
    name: string;
    physics: Physics;
    loader;
    constructor(name: string) {
        this.name = name;
        this.physics = new Physics();
    }
    async start() { }
    step(dt) { }
    tick(dt: number) {
        this.actors.forEach((v, k) => {
            v.tick?.(dt);
        });
    }
    getState() {
        const state = {};
        this.actors.forEach((v, k) => {
            state[k] = v.serialize();
        })
        return state;
    }
    updateState(data) { }
    newActor(data) { }
    addActor(actor: Actor, id: string){}
    removeActor(id: string){}
    add(obj){}
    exit() { }
}