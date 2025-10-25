import { Vector3 } from 'three';
import PlayerMovement from '../PlayerMovement';
import Player from '../Player';
import PlayerStateManager from './PlayerStateManager';
import PawnBody from '../../core/PawnBody';
import Game from '../../Game';
import { vectorsToLateralDegrees } from '../../utils/Utils';
import Input from '../../core/Input';
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
        /**@type {Input} */
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
    pivot(useVel = false) {
        const lookDir = this.actor.getShootData().dir.normalize();
        let moveDir;
        if (useVel) {
            moveDir = this.body.velocity;
            if (moveDir.length() < .8) return "Neutral";
            moveDir.normalize();
        } else {
            moveDir = this.movement.getInputDirection(-1);
        }

        let angleDeg = vectorsToLateralDegrees(lookDir, moveDir);

        const sector = Math.floor((angleDeg + 22.5) / 45) % 8;
        switch (sector) {
            case 0: return "Front";
            case 1: return "Front";
            case 2: return "Right";
            case 3: return "Right";
            case 4: return "Back";
            case 5: return "Left";
            case 6: return "Left";
            case 7: return "Front";
        }
    }
}