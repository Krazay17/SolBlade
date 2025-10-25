import { Vector3 } from "three";
import MyEventEmitter from "../../core/MyEventEmitter";
import PlayerState from "./_PlayerState";

export default class BladeState extends PlayerState {
    constructor(game, manager, actor, options = {}) {
        super(game, manager, actor, options);
        this.reEnter = false;
        this.jumpCD = 0;
        this.cdSpeed = 1000;
        this.dashTimer = null;
        this.lastEnter = null;
        this.lastExit = null;
        this.timer = 0;
        this.tempVector = new Vector3();
    }
    enter(state, neutral) {
        this.lastEnter = performance.now();
        this.floorTimer = null;
        this.animationManager.playAnimation('blade', true);
        this.actor.energyRegen = this.actor.bladeDrain;
    }
    update(dt) {
        if (this.input.keys['Space'] && this.grounded && !this.jumping) {
            clearTimeout(this.floorTimer);
            this.grounded = false;
            this.movement.jumpStart(.333);
            this.jumping = performance.now() + 400;
            this.actor.animationManager.playAnimation('jump', false);
            return;
        }
        if (this.jumping > performance.now()) return this.movement.jumpMove(dt, 6);
        else this.jumping = 0;
        this.actor.movement.bladeMove(dt);

        if (!this.input.actionStates.blade || this.actor.energy <= 0) {
            this.manager.setState('idle');
            return;
        }
        if (!this.actor.movement.isGrounded(.1)) {
            if (!this.floorTimer) {
                this.floorTimer = setTimeout(() => {
                    this.floorTimer = null;
                    this.grounded = false;
                }, 150);
            }
        } else {
            clearTimeout(this.floorTimer);
            this.floorTimer = null;
            if (!this.grounded) {
                //this.actor.movement.bladeStart();
            }
            this.grounded = true;
        }

        if (this.grounded) {
            this.animationManager.playAnimation('blade', true);
        } else {
            this.animationManager.playAnimation('bladeAir', true);
        }
    }
    exit(state) {
        clearTimeout(this.floorTimer);
        this.floorTimer = null;
        this.grounded = false;
        this.lastExit = performance.now();

        if (state === 'bladeJump') return;
        this.actor.energyRegen = 25;

        //netSocket.emit('playerBlockUpdate', false);
    }
    canEnter() {
        return !this.actor.getDimmed()
    }
}