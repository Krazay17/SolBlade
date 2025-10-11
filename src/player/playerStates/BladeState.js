import { Vector3 } from "three";
import MyEventEmitter from "../../core/MyEventEmitter";
import soundPlayer from "../../core/SoundPlayer";
import PlayerState from "./_PlayerState";

export default class BladeState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.reEnter = false;
        this.jumpCD = 0;
        this.cdSpeed = 1000;
        this.dashTimer = null;
        this.lastEnter = null;
        this.lastExit = null;
        this.timer = 0;
        this.tempVector = new Vector3();

        soundPlayer.loadPosAudio('dash', '/assets/Dash.mp3');
        MyEventEmitter.on('netFx', (data) => {
            if (data.type === 'dash') {
                this.dashFx(this.tempVector.set(data.pos.x, data.pos.y, data.pos.z));
            }
        });
    }
    enter(state, neutral) {
        this.lastEnter = performance.now();
        this.floorTimer = null;
        this.actor.animationManager?.setAnimState('crouch', false);
        this.actor.energyRegen = this.actor.bladeDrain;
    }
    update(dt) {
        // if (this.dashTimer > performance.now()) {
        //     this.actor.movement.dashMove(dt, 6, 6);
        //     return;
        // }
        // Jump
        if (this.input.keys['Space'] && this.grounded && !this.jumping) {
            clearTimeout(this.floorTimer);
            this.grounded = false;
            this.movement.jumpStart(.333);
            this.jumping = performance.now() + 400;
            this.actor.animationManager.playAnimation('jump')
            return;
        }
        if (this.jumping > performance.now()) return this.movement.jumpMove(dt, 6);
        else this.jumping = 0;
        this.actor.movement.bladeMove(dt);

        this.actor.animationManager?.playAnimation('crouch', false);

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
    dashFx(pos) {
        soundPlayer.playPosAudio('dash', pos);
    }
}