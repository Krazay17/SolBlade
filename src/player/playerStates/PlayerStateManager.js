import * as States from './index.js';

export default class PlayerStateManager {
    constructor(game, actor) {
        this.game = game;
        this.actor = actor;
        this.states = {
            idle: new States.IdleState(game, this, actor),
            run: new States.RunState(game, this, actor),
            jump: new States.JumpState(game, this, actor),
            fall: new States.FallState(game, this, actor),
            attack: new States.AttackState(game, this, actor),
            stun: new States.StunState(game, this, actor),
            knockback: new States.KnockbackState(game, this, actor),
            dash: new States.DashState(game, this, actor),
            emote: new States.EmoteState(game, this, actor),
            blade: new States.BladeState(game, this, actor),
            dead: new States.DeadState(game, this, actor),
            parry: new States.ParryState(game, this, actor),
            bladeJump: new States.BladeJumpState(game, this, actor),
            // wallCling: new States.WallClingState(game, this),
            // wallSlide: new States.WallSlideState(game, this),
            // wallJump: new States.WallJumpState(game, this),
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
            console.log(`State change: ${this.lastState} -> ${newState}`);
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