import * as States from './PlayerStates.js';

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
            dash: new States.DashState(actor, this)
        };
        this.movementState = this.states.idle;
        this.actionState = null;
    }

    update(dt, time) {
        this.movementState?.update(dt, time);
        this.actionState?.update(dt, time);
    }

    setMovementState(state, options) {
        let newState = state;
        if (state === 'idle' && !this.actor.floorTrace()) {
            newState = 'fall';
        }
        if (this.states[newState]) {
            this.movementState?.exit();
            this.movementState = this.states[newState];
            this.movementState?.enter(options);
        }
    }

    setActionState(state, options) {
        if (this.states[state]) {
            this.actionState?.exit();
            this.actionState = this.states[state];
            this.actionState?.enter(options);
        }
    }

    reset() {
        this.movementState = this.states.idle;
        this.actionState = null;
    }

    tryDash() {
        if (this.states.dash.lastTime > performance.now()) return false;
        this.states.dash.lastTime = performance.now() + this.states.dash.cd;
        this.setMovementState('dash');
        return true;

    }
}