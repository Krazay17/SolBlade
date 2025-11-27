import Pawn from "@solblade/common/actors/Pawn.js"
import FSM from "./FSM.js";

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
    enter(state, params) { }
    exit(state) { }
    update(dt) { }
    canEnter(state) { return true }
    canExit(state) { return true }
}