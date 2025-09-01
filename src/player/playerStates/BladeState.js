import PlayerState from "./_PlayerState";
import { Vec3 } from "cannon";

export default class BladeState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.friction = 0;
        this.groundAccel = 3;
        this.maxGroundSpeed = 12;
    }
    enter() {
        this.actor.animator?.setAnimState('crouch', true);

        //const floorDotHorz = 1 - this.actor.groundChecker.floorDot();
        //this.body.velocity.mult(1 + floorDotHorz, this.body.velocity);
        this.tempVec.copy(this.actor.groundChecker.floorNormal());
        this.tempVec.cross(new Vec3(0, 1, 0), this.tempVec);
        this.actor.groundChecker.floorNormal().cross(this.tempVec, this.tempVec);
        console.log(this.tempVec);
        this.body.velocity.vadd(this.tempVec.scale(this.body.velocity.length()), this.body.velocity);
    }
    update(dt) {
        this.groundMove(dt);
        this.tempVec.copy(this.actor.groundChecker.floorNormal());
        this.tempVec.cross(new Vec3(0, 1, 0), this.tempVec);
        this.actor.groundChecker.floorNormal().cross(this.tempVec, this.tempVec);
        this.body.velocity.vadd(this.tempVec.scale(20 * dt), this.body.velocity);

        if (!this.input.actionStates.blade) {
            this.manager.setState('idle');
            return;
        }

        // Jump
        if (this.input.keys['Space']) {
            this.manager.setState('jump');
            return;
        }

        if (this.actor.groundChecker.floorDot() < 0.4) {
            this.manager.setState('fall');
            return;
        }
    }
}