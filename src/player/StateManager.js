import * as States from './PlayerStates.js';

export default class StateManager {
    constructor(actor) {
        this.actor = actor;
        this.states = {
            idle: new States.IdleState(actor),
            run: new States.RunState(actor),
            jump: new States.JumpState(actor),
            fall: new States.FallState(actor),
            attack: new States.AttackState(actor),
            knockback: new States.KnockbackState(actor),
            dash: new States.DashState(actor)
        };
        this.movementState = this.states.idle;
        this.actionState = null;
    }

    update(dt, time) {
        this.movementState?.update(dt, time);
        this.actionState?.update(dt, time);
    }

    setMovementState(state) {
        if (this.states[state]) {
            this.movementState = this.states[state];
        }
    }

    setActionState(state) {
        if (this.states[state]) {
            this.actionState = this.states[state];
        }
    }
}