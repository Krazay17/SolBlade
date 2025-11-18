import AttackState from "./AttackState.js";
import ChaseState from "./ChaseState.js";
import FallState from "./FallState.js";
import IdleState from "./IdleState.js";
import RunState from "./RunState.js";

export default class SFSM {
    constructor(game, pawn, data) {
        this.game = game;
        this.pawn = pawn;
        this.states = {
            idle: new IdleState(game, pawn, data),
            chase: new ChaseState(game, pawn, data),
            attack: new AttackState(game, pawn, data),
        };
        this.state = this.states['idle'];
    }
    setState(state, params) {
        const lastState = this.state.name;
        if (state === lastState && !this.state.reEnter) return false
        const newState = this.states[state];
        if (!newState) return;
        if (state !== "dead") {
            if (!this.state.canExit()) return false;
            if (!newState.canEnter()) return false;
        }

        this.state.exit(state);
        this.state = newState;
        this.state.enter(lastState, params);

        this.pawn.stateChanged = true;

        return true;
    }
    update(dt) {
        if (this.state) this.state.update(dt);
    }
}