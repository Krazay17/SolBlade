import * as States from './PlayerStates.js';

export default class StateManager {
    constructor(actor) {
        this.actor = actor;
        this.states = {
            idle: new States.IdleState(actor, this),
            run: new States.RunState(actor, this),
            jump: new States.JumpState(actor, this, { accel: 100, maxSpeed: 3 }),
            fall: new States.FallState(actor, this, { accel: 50, maxSpeed: 3 }),
            attack: new States.AttackState(actor, this),
            knockback: new States.KnockbackState(actor, this),
            dash: new States.DashState(actor, this),
            emote: new States.EmoteState(actor, this),
        };
        this.movementState = this.states.idle;
        this.actionState = null;
        this.currentStateName = 'idle';
    }

    update(dt, time) {
        this.movementState?.update(dt, time);
        this.actionState?.update(dt, time);
    }

    setState(state, enterParams) {
        console.log(`Changing state from ${this.currentStateName} to ${state}`);
        this.currentStateName = state;
        let newState = state;
        if (state === 'idle' && !this.actor.floorTrace()) {
            newState = 'fall';
        }
        if (this.states[newState]) {
            this.movementState?.exit();
            this.movementState = this.states[newState];
            this.movementState?.enter(enterParams);
        }
    }

    setActionState(state, enterParams) {
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
        this.movementState = this.states.idle;
        this.actionState = null;
    }

    tryDash() {
        if (this.states.dash.lastTime > performance.now()) return false;
        this.states.dash.lastTime = performance.now() + this.states.dash.cd;
        this.setState('dash');
        return true;
    }
    tryAttack() {
        if (this.actionState) return false;
        this.setActionState('attack');
        return true;
    }
    tryEmote(emote) {
        if (this.actionState) return false;
        this.setState('emote', emote);
        return true;
    }
}