import { arrayBuffer } from "../utils/Utils.js";
import { EventEmitter } from "./EventEmitter.js"
const typeMap = {
    0: "player",
}
const meshMap = {
    0: "spikeMan",
}
const animMap = {
    0: "idle",
}
export class GameState {
    constructor() {
        this.events = new EventEmitter();
        this.actors = new Map();
        this.players = new Map();

        this.stateId = 0;
    }
    updateState(data) {
        const state = new Float32Array(data);
        this.stateId = state[0];
        let actorStates = new Map();
        for (let i = 1; i < state.length; i += 11) {
            const id = state[i];
            const actorData = {
                id,
                pos: state.subarray(i + 1, i + 4),
                rot: state.subarray(i + 4, i + 8),
                type: typeMap[state[i + 8]],
                mesh: meshMap[state[i + 9]],
                anim: animMap[state[i + 10]],
            }
            actorStates.set(id, actorData);
            const actor = this.actors.get(id);
            if (!actor) this.newActor(actorData);
        }
        this.events.emit('updateState', actorStates);
    }
    getState() {
        this.stateId++;
        return arrayBuffer([...this.actors.values()], 11, this.stateId);
    }
    addActor(id, actor) {
        this.actors.set(id, actor);
        this.events.emit("addActor", id, actor);
    }
    newActor(data) {
        const { id, type } = data;
        this.actors.set(id, data);
        this.events.emit("newActor", data)
    }
}