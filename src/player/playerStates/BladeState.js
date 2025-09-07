import { netSocket } from "../../core/NetManager";
import PlayerState from "./_PlayerState";
import { Vec3 } from "cannon";

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
    }
    enter(neutral) {
        if (!neutral) {
            this.dashTimer = performance.now() + 300;
            this.actor.movement.dashStart();
            this.actor.animator?.setAnimState('dash');

        }
        this.actor.animator?.setAnimState('crouch', true);
        // const boost = this.lastEnter ? Math.min((performance.now() - this.lastExit) / this.cdSpeed, this.maxEnterBoost) : this.maxEnterBoost;
        // this.actor.movement.bladeStart(Math.max(boost, 1));
        this.lastEnter = performance.now();
        this.floorTimer = null;

        netSocket.emit('playerBlockUpdate', { id: this.actor.netId, blocking: true });

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
        if (this.input.keys['Space'] && this.actor.groundChecker.isGrounded(.1) &&
            this.jumpCD < performance.now()) {
            //if (!this.actor.tryUseEnergy(10)) return;
            this.jumpCD = performance.now() + 300;
            this.actor.movement.jumpStart();
            this.actor.animator?.setAnimState('jump');
            return;
        }
        if (this.actor.groundChecker.isGrounded(.1) && !this.grounded) {
            this.grounded = true;
            this.actor.movement.bladeStart();
        }
        if (!this.actor.groundChecker.isGrounded(.1) && this.grounded) {
            this.grounded = false;
        }
        // if (!this.actor.groundChecker.isGrounded(.1)) {
        //     if (!this.floorTimer) {
        //         this.floorTimer = setTimeout(() => {
        //             this.manager.setState('fall');
        //             this.floorTimer = null;
        //         }, 300);
        //     }
        // } else {
        //     clearTimeout(this.floorTimer);
        //     this.floorTimer = null;
        // }
    }
    exit() {
        console.log('exit blade');
        clearTimeout(this.floorTimer);
        this.floorTimer = null;
        this.lastExit = performance.now();

        this.actor.energyRegen = 25;

        netSocket.emit('playerBlockUpdate', { id: this.actor.netId, blocking: false });
    }
}