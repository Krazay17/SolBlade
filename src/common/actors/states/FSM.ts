import IdleState from "@solblade/server/actors/states/IdleState";
import PatrolState from "@solblade/server/actors/states/PatrolState";
import { Pawn } from "../../core/Interfaces";

const stateRegistry = {
    idle: IdleState,
    patrol: PatrolState
}

export default class FSM<T extends Pawn> {
    owner: T
    states: Record<string, any> = {};
    state: any | null = null;
    stateName: string;
    constructor(owner: T, states: Record<string, any> = {}) {
        this.owner = owner;
        for (const [name, stateClass] of Object.entries(states)) {
            this.states[name] = new stateClass(this, owner);
        }
        if (this.states['idle']) this.state = this.states['idle'];
        this.stateName = 'idle';
    }
    addStates(states = []) {
        for (const s of states) {
            const sClass = stateRegistry[s];
            if (!sClass) return;
            this.states[s] = new sClass(this, this.owner);
        }
    }
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
        this.stateName = state;

        console.log(`${state} prev: ${lastState}`);

        return true;
    }
    update(dt) {
        if (this.state) this.state.update(dt);
    }
}