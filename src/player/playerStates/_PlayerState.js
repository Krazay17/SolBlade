import { Vec3 } from 'cannon';
import { Vector3 } from 'three';
export default class PlayerState {
    constructor(actor, manager, options = {}) {
        this.actor = actor;
        this.manager = manager;
        this.body = actor.body;
        this.input = actor.input;
        this.tempVec = new Vec3();
        this.tempVector = new Vector3();

        this.cd = 0;
        this.cdTimer = 0;
        this.exitTimer = 0;
        this.reEnter = false;

        Object.assign(this, options);
    }

    enter() { }
    update(dt) { }
    exit() { }
    canEnter() {
        return true;
    }
    canExit() {
        return true;
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