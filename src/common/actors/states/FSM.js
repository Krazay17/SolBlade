import IdleState from "@solblade/server/actors/states/IdleState";
import PatrolState from "@solblade/server/actors/states/PatrolState";

const stateRegistry = {
    idle: IdleState,
    patrol: PatrolState
}

export default class FSM {
    constructor(owner, states = {}) {
        this.owner = owner;

        this.states = {
            idle: new stateRegistry['idle'](this, this.owner),
        };
        for (const [name, stateClass] of Object.entries(states)){
            this.states[name] = new stateClass(this, owner);
        }
        this.state = this.states['idle'];
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

        console.log(`state: ${state} last: ${lastState}`);

        return true;
    }
    update(dt) {
        if (this.state) this.state.update(dt);
    }
}