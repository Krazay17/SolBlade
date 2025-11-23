import Pawn from "../actors/Pawn";
import FSM from "./FSM";

export default class State {
    /**
     * 
     * @param {FSM} fsm 
     * @param {Pawn} pawn 
     */
    constructor(fsm, pawn) {
        this.fsm = fsm;
        this.pawn = pawn;
        this.name = "state";
        this.canReEnter = false;
    }
    get controller() { return this.pawn.controller }
    get movement() { return this.pawn.movement }
    setState(state, params) { this.fsm.setState(state, params) }
    enter(lState, params) { }
    exit(nState) { }
    update(dt) { }
    canEnter() { return true }
    canExit() { return true }
}