import * as States from './index.js';

export default class StateManager {
    constructor(actor) {
        this.actor = actor;
        this.states = {
            idle: new States.IdleState(actor, this),
            run: new States.RunState(actor, this),
            jump: new States.JumpState(actor, this),
            fall: new States.FallState(actor, this),
            attack: new States.AttackState(actor, this),
            stun: new States.StunState(actor, this),
            dash: new States.DashState(actor, this),
            emote: new States.EmoteState(actor, this),
            blade: new States.BladeState(actor, this),
        };
        this.activeState = this.states.idle;
        this.actionState = null;
        this.currentStateName = 'idle';
        this.lastState = null;
    }

    update(dt, time) {
        this.activeState?.update(dt, time);
        this.actionState?.update(dt, time);
    }

    setState(state, enterParams) {
        if ((this.currentStateName === state && !this.activeState.reEnter) && this.activeState) return false;
        if (!this.states[state]?.canEnter(enterParams)) return false;
        if (!this.activeState?.canExit(enterParams)) return false;

        let newState = state;
        if (this.states[newState]) {
            this.activeState?.exit();
            this.lastState = this.currentStateName;
            this.activeState = this.states[newState];
            this.activeState?.enter(enterParams);
            this.currentStateName = newState;
            console.log(newState);
            return true;
        }
    }

    setActionState(state, enterParams) {
        if (!this.states[state]?.canEnter(enterParams)) return false;
        if (!this.actionState?.canExit(enterParams)) return false;

        if (this.states[state]) {
            this.actionState?.exit();
            this.actionState = this.states[state];
            this.actionState?.enter(enterParams);
        } else {
            this.actionState?.exit();
            this.actionState = null;
        }
    }

    setStateProp(state, prop, value) {
        if (this.states[state]) {
            this.states[state][prop] = value;
        }
    }

    reset() {
        this.activeState = this.states.idle;
        this.actionState = null;
    }

    tryEmote(emote) {
        if (this.actionState) return false;
        this.setState('emote', emote);
        return true;
    }
}