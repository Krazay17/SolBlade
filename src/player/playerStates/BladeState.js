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
    enter(neutral) {
        this.lastEnter = performance.now();
        this.floorTimer = null;

        if (!neutral) {
            this.dashTimer = performance.now() + 300;
            this.actor.movement.dashStart();
            this.actor.animator?.setAnimState('dash');

            this.dashFx(this.actor.position);
            MyEventEmitter.emit('fx', { type: 'dash', pos: this.actor.position });
            return;
        }
        this.actor.animator?.setAnimState('crouch', true);
        // const boost = this.lastEnter ? Math.min((performance.now() - this.lastExit) / this.cdSpeed, this.maxEnterBoost) : this.maxEnterBoost;
        // this.actor.movement.bladeStart(Math.max(boost, 1));

        //netSocket.emit('playerBlockUpdate', true);

        // if (this.actor.groundChecker.isGrounded(.6)) {
        //     this.enterBoost = this.lastEnter ? Math.max(1, Math.min((performance.now() - this.lastEnter) / 1000, this.maxEnterBoost)) : this.maxEnterBoost;
        //     this.lastEnter = performance.now();
        //     this.body.velocity.mult(this.enterBoost, this.body.velocity);
        // }
    }
    update(dt) {
        if (this.dashTimer > performance.now()) {
            this.actor.movement.dashMove(dt, 22, 10);
            return;
        }
        this.actor.movement.bladeMove(dt);
        
        if (this.jumpCD < performance.now()) {
            this.actor.animator?.setAnimState('crouch', true);
        }

        if (!this.input.actionStates.blade || this.actor.energy <= 0) {
            this.manager.setState('idle');
            return;
        }

        // Jump
        if (this.input.keys['Space'] && this.grounded &&
            this.jumpCD < performance.now()) {
            //if (!this.actor.tryUseEnergy(10)) return;
            this.jumpCD = performance.now() + 300;
            this.actor.movement.jumpStart();
            this.actor.animator?.setAnimState('jump');
            return;
        }
        if (!this.actor.groundChecker.isGrounded(.1)) {
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
                this.actor.movement.bladeStart();
            }

            this.grounded = true;
        }
    }
    exit() {
        clearTimeout(this.floorTimer);
        this.floorTimer = null;
        this.lastExit = performance.now();

        this.actor.energyRegen = 25;

        //netSocket.emit('playerBlockUpdate', false);
    }
    dashFx(pos) {
        soundPlayer.playPosAudio('dash', pos);
    }
}