import * as States from './index.js';

export default class PlayerStateManager {
    constructor(actor) {
        this.actor = actor;
        this.states = {
            idle: new States.IdleState(actor, this),
            run: new States.RunState(actor, this),
            jump: new States.JumpState(actor, this),
            fall: new States.FallState(actor, this),
            attack: new States.AttackState(actor, this),
            stun: new States.StunState(actor, this),
            knockback: new States.KnockbackState(actor, this),
            dash: new States.DashState(actor, this),
            emote: new States.EmoteState(actor, this),
            blade: new States.BladeState(actor, this),
            dead: new States.DeadState(actor, this),
            parry: new States.ParryState(actor, this),
            bladeJump: new States.BladeJumpState(actor, this),
            // wallCling: new States.WallClingState(actor, this),
            // wallSlide: new States.WallSlideState(actor, this),
            // wallJump: new States.WallJumpState(actor, this),
        };
        this.activeState = this.states.idle;
        this.actionState = null;
        this.currentStateName = 'idle';
        this.currentActionStateName = null;
        this.lastState = null;
    }

    update(dt, time) {
        this.activeState?.update(dt, time);
        this.actionState?.update(dt, time);
    }

    setState(state, enterParams) {
        if ((this.currentStateName === state && !this.activeState?.reEnter) && this.activeState) return false;
        if (!this.states[state]?.canEnter(state, enterParams)) return false;
        if (!this.activeState?.canExit(state, enterParams) && state !== 'dead') return false;

        let newState = state;
        if (this.states[newState]) {
            this.activeState?.exit(newState);
            this.lastState = this.currentStateName;
            this.activeState = this.states[newState];
            //console.log(`State change: ${this.lastState} -> ${newState}`);
            this.activeState?.enter(this.lastState, enterParams);
            this.currentStateName = newState;
            return true;
        }
    }

    setActionState(state, enterParams) {
        if(!state && this.actionState?.canExit()) {
            this.actionState?.exit();
            this.actionState = null;
            return true;
        }
        if (this.actionState && (this.currentActionStateName === state && !this.actionState?.reEnter)) return false;
        if (!this.states[state]?.canEnter(state, enterParams)) return false;
        if (this.actionState && !this.actionState?.canExit(state, enterParams) && this.activeState !== 'dead') return false;

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