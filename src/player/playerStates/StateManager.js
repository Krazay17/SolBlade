import RunBoost from '../RunBoost.js';
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
        this.runBooster = new RunBoost(actor);
        this.activeState = this.states.idle;
        this.actionState = null;
        this.currentStateName = 'idle';
        this.lastVelocity;
        this.runBoost = 0;
        this.maxRunBoost = 5000;
    }

    update(dt, time) {
        this.activeState?.update(dt, time);
        this.actionState?.update(dt, time);
        this.runBooster?.update(dt, this.currentStateName);
    }

    setState(state, enterParams) {
        this.currentStateName = state;
        let newState = state;
        const floor = this.actor.floorTrace();
        if (state === 'idle' && !floor) {
            newState = 'fall';

        }
        if (this.states[newState]) {
            this.activeState?.exit();
            this.activeState = this.states[newState];
            this.activeState?.enter(enterParams);
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
        this.activeState = this.states.idle;
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