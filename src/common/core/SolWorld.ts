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
        const data = [];
        this.actors.forEach((v, k) => {
            const obj = v.serialize();
            data.push(obj);
        })
        return data
    }
    updateState(data) { }
    newActor(data) { }
    exit() { }
}