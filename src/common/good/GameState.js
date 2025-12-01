import { EventEmitter } from "./EventEmitter.js"

export class GameState {
    constructor(){
        this.events = new EventEmitter();
        this.actors = new Map();
        this.players = new Map();
    }
    getState(){
        return "Game State!";
    }
    addActor(id, actor){
        this.actors.set(id, actor);
        this.events.emit("addActor", id, actor);
    }
}