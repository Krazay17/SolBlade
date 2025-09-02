import PlayerState from "./_PlayerState";
import { Vec3 } from "cannon";

export default class BladeState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.enterBoost = 1.5;
        this.maxEnterBoost = 1.5;
    }
    enter() {
        this.actor.animator?.setAnimState('crouch', true);

        if (this.actor.groundChecker.isGrounded()) {
            this.enterBoost = this.lastEnter ? Math.max(1, Math.min((performance.now() - this.lastEnter) / 1000, this.maxEnterBoost)) : this.maxEnterBoost;
            this.lastEnter = performance.now();
            this.body.velocity.mult(this.enterBoost, this.body.velocity);
            console.log(this.enterBoost);
        }


        //const floorDotHorz = 1 - this.actor.groundChecker.floorDot();
        //this.body.velocity.mult(1 + floorDotHorz, this.body.velocity);
        // this.tempVec.copy(this.actor.groundChecker.floorNormal());
        // this.tempVec.cross(new Vec3(0, 1, 0), this.tempVec);
        // this.actor.groundChecker.floorNormal().cross(this.tempVec, this.tempVec);
        // console.log(this.tempVec);
        // this.body.velocity.vadd(this.tempVec.scale(this.body.velocity.length()), this.body.velocity);
    }
    update(dt) {
        this.actor.movement.bladeMove(dt);

        // this.tempVec.copy(this.actor.groundChecker.floorNormal());
        // this.tempVec.cross(new Vec3(0, 1, 0), this.tempVec);
        // this.actor.groundChecker.floorNormal().cross(this.tempVec, this.tempVec);
        // this.body.velocity.vadd(this.tempVec.scale(15 * dt), this.body.velocity);

        if (!this.input.actionStates.blade) {
            this.manager.setState('idle');
            return;
        }

        // Jump
        if (this.input.keys['Space'] && this.actor.groundChecker.isGrounded()) {
            this.manager.setState('jump');
            return;
        }
        if (this.input.actionStates.dash) {
            this.manager.setState('dash');
            return;
        }
    }
}