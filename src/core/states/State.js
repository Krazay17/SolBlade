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
        this.canReEnter = false;
    }
    enter(lState, params) { }
    exit(nState) { }
    update(dt) { }
    canEnter() { }
    canExit() { }
}