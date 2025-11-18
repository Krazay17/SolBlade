import ChaseState from "./ChaseState.js";
import FallState from "./FallState.js";
import IdleState from "./IdleState.js";
import RunState from "./RunState.js";

export default class SFSM {
    constructor(game, pawn, data) {
        this.game = game;
        this.pawn = pawn;
        this.moveStates = {
            idle: new IdleState(game, pawn, data),
            chase: new ChaseState(game, pawn, data)
        };
        this.moveState = this.moveStates['idle'];
    }
    setState(state) {
        const lastState = this.moveState.name;
        if (state === lastState && !this.moveState.reEnter) return false
        const newState = this.moveStates[state];
        if (!newState) return;
        if (state !== "dead") {
            if (!this.moveState.canExit()) return false;
            if (!newState.canEnter()) return false;
        }

        this.moveState.exit(state);
        this.moveState = newState;
        this.moveState.enter(lastState);

        this.pawn.stateChanged = true;

        return true;
    }
    update(dt) {
        if (this.moveState) this.moveState.update(dt);
    }
}