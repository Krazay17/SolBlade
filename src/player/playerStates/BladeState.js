import { Vector3 } from "three";
import MyEventEmitter from "../../core/MyEventEmitter";
import soundPlayer from "../../core/SoundPlayer";
import PlayerState from "./_PlayerState";

export default class BladeState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.reEnter = false;
        this.enterBoost = 1.5;
        this.maxEnterBoost = 1.5;
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

        if (!neutral && state !== 'bladeJump') {
            this.dashTimer = performance.now() + 300;
            this.actor.movement.dashStart();
            this.actor.animator?.setAnimState('dash');

            this.dashFx(this.actor.position);
            MyEventEmitter.emit('fx', { type: 'dash', pos: this.actor.position });
            return;
        }
        this.actor.animator?.setAnimState('crouch', false);
    }
    update(dt) {
        if (this.dashTimer > performance.now()) {
            this.actor.movement.dashMove(dt, 22, 10);
            return;
        }
        this.actor.movement.bladeMove(dt);

        if (this.jumpCD < performance.now()) {
            this.actor.animator?.setAnimState('crouch', false);
        }

        if (!this.input.actionStates.blade || this.actor.energy <= 0) {
            this.manager.setState('idle');
            return;
        }

        // Jump
        if (this.input.keys['Space'] && this.grounded
            && this.manager.setState('bladeJump')) {
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
        return !this.actor.getDimmed();
    }
    dashFx(pos) {
        soundPlayer.playPosAudio('dash', pos);
    }
}