import Pawn from "../Pawn.js";
import DeadState from "./DeadState.js";
import FallState from "./FallState.js";
import IdleState from "./IdleState.js";
import PatrolState from "./PatrolState.js";
import RunState from "./RunState.js";

const stateRegistry = {
    idle: IdleState,
    run: RunState,
    dead: DeadState,
    fall: FallState,
    patrol: PatrolState
}

export default class FSM {
    /**
     * 
     * @param {Pawn} pawn 
     * @param {String[]} states 
     * @returns 
     */
    constructor(pawn, states = []) {
        this.pawn = pawn;

        this.states = {
            idle: new stateRegistry['idle'](this, this.pawn),
            dead: new stateRegistry['dead'](this, this.pawn),
        };
        this.state = this.states['idle'];
        this.stateName = 'idle';

        for (const s of states) {
            const sClass = stateRegistry[s];
            if (!sClass) return;
            this.states[s] = new sClass(this, this.pawn);
        }
    }
    get animation() { return this.pawn.animation }

    setState(state, params) {
        const lastState = this.stateName;
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

        console.log(`Pawn name: ${this.pawn.name}`, `Old state: ${lastState}`, `New state ${state}`);
        this.stateName = state;

        this.pawn.stateChanged(state);

        return true;
    }
    update(dt) {
        if (this.state) this.state.update(dt);
    }
}