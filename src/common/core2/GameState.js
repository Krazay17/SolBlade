import { EventEmitter } from "./EventEmitter";

export class GameState {
    constructor(){
        this.events = new EventEmitter();
        this.actors = new Map();
    }
    addActor(id, actor){
        this.actors.set(id, actor);
        this.events.emit("addActor", id, actor);
    }
}