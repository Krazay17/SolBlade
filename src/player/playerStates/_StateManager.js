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
            knockback: new States.KnockbackState(actor, this),
            dash: new States.DashState(actor, this),
            emote: new States.EmoteState(actor, this),
        };
        this.activeState = this.states.idle;
        this.actionState = null;
        this.currentStateName = 'idle';
    }

    update(dt, time) {
        this.activeState?.update(dt, time);
        this.actionState?.update(dt, time);
    }

    setState(state, enterParams) {
        if (this.currentStateName === state && this.activeState) return;
        if (!this.states[state]?.canEnter(enterParams)) return;
        if (!this.activeState?.canExit(enterParams)) return;

        let newState = state;
        if (this.states[newState]) {
            this.activeState?.exit();
            this.activeState = this.states[newState];
            this.activeState?.enter(enterParams);
            this.currentStateName = newState;
            console.log(newState);
        }
    }

    setActionState(state, enterParams) {
        if (!this.states[state]?.canEnter(enterParams)) return;
        if (!this.actionState?.canExit(enterParams)) return;

        if (this.states[state]) {
            this.actionState?.exit();
            this.actionState = this.states[state];
            this.actionState?.enter(enterParams);
        } else {
            this.actionState?.exit();
            this.actionState = null;
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