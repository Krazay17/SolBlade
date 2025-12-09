import { Pawn } from "../Pawn";

export default class FSM {
    pawn: Pawn;
    states: Record<string, any> = {};
    state: any | null = null;
    stateName: string;
    constructor(pawn: Pawn, states: Record<string, any> = {}) {
        this.pawn = pawn;
        for (const [name, stateClass] of Object.entries(states)) {
            this.states[name] = new stateClass(this, pawn);
        }
        if (this.states['idle']) this.state = this.states['idle'];
        this.stateName = 'idle';
    }
    setState(state, params?: any) {
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
        this.stateName = state;

        console.log(`${state} prev: ${lastState}`);

        return true;
    }
    update(dt) {
        if (this.state) this.state.update(dt);
    }
}