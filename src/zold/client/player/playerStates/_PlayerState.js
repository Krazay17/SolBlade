import { Vector3 } from 'three';
import PlayerMovement from '../../../../client/actors/components/PlayerMovement';
import Player from '../Player';
import PlayerStateManager from './PlayerStateManager';
import PawnBody from '../../core/PawnCapsule';
import Game from '../../CGame';
import { vectorsToLateralDegrees } from '../../../../common/utils/Utils';
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
        this.body = actor.pawnBody;
        /**@type {Input} */
        this.input = actor.input;

        this.tempVector = new Vector3();

        this.cd = 0;
        this.cdTimer = 0;
        this.duration = 0;
        this.exitTimer = 0;
        this.reEnter = false;
        this.onExit = null

        Object.assign(this, options);
    }
    get animationManager() {
        return this.actor.animationManager;
    }

    enter() {
        if (this.cd) this.cdTimer = performance.now() + this.cd;
        if (this.duration) this.exitTimer = performance.now() + this.duration;
    }
    update(dt) { }
    exit() { }
    canEnter() {
        return this.cdTimer ? this.cdTimer < performance.now() : true;
    }
    canExit() {
        return this.exitTimer ? this.exitTimer < performance.now() : true;
    }

    isTryingToMove() {
        if (this.input.keys['KeyW'] || this.input.keys['KeyA'] || this.input.keys['KeyS'] || this.input.keys['KeyD']) {
            return true;
        }
        return false;
    }
    pivot(useVel = false) {
        const lookDir = this.actor.getShootData().dir;
        let moveDir;
        if (useVel) {
            moveDir = this.actor.velocity;
            const lateral = Math.atan2(moveDir.x, moveDir.z);
            if (lateral === 0) return "Neutral";
            moveDir.normalize();
        } else {
            moveDir = this.movement.getInputDirection();
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