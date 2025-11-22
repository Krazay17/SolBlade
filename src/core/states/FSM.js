import Pawn from "../actors/Pawn";
import GameCore from "../GameCore";
import DeadState from "./DeadState";
import IdleState from "./IdleState";
import RunState from "./RunState";
import State from "./State";

const stateRegistry = {
    idle: IdleState,
    run: RunState,
    dead: DeadState,
}

export default class FSM {
    /**
     * 
     * @param {GameCore} game 
     * @param {Pawn} pawn 
     * @param {State} states 
     * @returns 
     */
    constructor(game, pawn, states = []) {
        this.game = game;
        this.pawn = pawn;

        this.states = {
            idle: new stateRegistry['idle'](this, this.pawn),
            dead: new stateRegistry['dead'](this, this.pawn),
        };
        this.state = this.states['idle'];

        for (const s of states) {
            const sClass = stateRegistry[s];
            if (!sClass) return;
            this.states[s] = new sClass(this, this.pawn);
        }
    }
    get animation() { return this.pawn.animation }

    setState(state, params) {
        const lastState = this.state.name;
        if (state === lastState && !this.state.canReEnter) return false
        const newState = this.states[state]
        if (!newState) return;

        if (state !== "dead") {
            if (!this.state.canExit(state)) return false;
            if (!newState.canEnter(state)) return false;
        }

        this.state.exit(state);
        this.state = newState;
        this.state.enter(lastState, params);

        this.pawn.stateChanged(state);

        return true;
    }
    update(dt) {
        if (this.state) this.state.update(dt);
    }
}