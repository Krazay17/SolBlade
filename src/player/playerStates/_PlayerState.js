import { Vector3 } from 'three';
import PlayerMovement from '../PlayerMovement';
import Player from '../Player';
import PlayerStateManager from './PlayerStateManager';
import PawnBody from '../../core/PawnBody';
import Game from '../../Game';
export default class PlayerState {
    constructor(game, manager, actor, options = {}) {
        /**@type {Game} */
        this.game = game;
        /**@type {PlayerStateManager} */
        this.stateManager = manager;
        /**@type {Player} */
        this.actor = actor;
        /**@type {PlayerMovement} */
        this.movement = actor.movement;
        /**@type {PlayerStateManager} */
        this.manager = manager;
        /**@type {PawnBody} */
        this.body = actor.body;
        this.input = actor.input;
        
        this.tempVector = new Vector3();

        this.cd = 0;
        this.cdTimer = 0;
        this.duration = 0;
        this.exitTimer = 0;
        this.reEnter = false;

        Object.assign(this, options);
    }
    get animationManager() {
        return this.actor.animationManager;
    }

    enter() {
        this.cdTimer = performance.now() + this.cd;
        this.exitTimer = performance.now() + this.duration;
    }
    update(dt) { }
    exit() { }
    canEnter() {
        return this.cdTimer < performance.now();
    }
    canExit() {
        return this.exitTimer < performance.now();
    }

    setAnimState(state) {
        this.actor?.setAnimState?.(state);
    };

    isTryingToMove() {
        if (this.input.keys['KeyW'] || this.input.keys['KeyA'] || this.input.keys['KeyS'] || this.input.keys['KeyD']) {
            return true;
        }
        return false;
    }
}