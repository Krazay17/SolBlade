import { EventEmitter } from "./EventEmitter";

export class World {
    constructor() {
        this.events = new EventEmitter();
        this.actors = new Map();
    }
    addActor(id, data) {
        this.actors.set(id, data);
        this.events.emit("actor_added", id, data);
    }
}