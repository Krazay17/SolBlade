import PlayerState from "./_PlayerState";
import { Vec3 } from "cannon";

export default class BladeState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.enterBoost = 1.3;
        this.maxEnterBoost = 1.3;
    }
    enter() {
        this.actor.animator?.setAnimState('crouch', true);

        if (this.actor.groundChecker.isGrounded(.6)) {
            this.enterBoost = this.lastEnter ? Math.max(1, Math.min((performance.now() - this.lastEnter) / 1000, this.maxEnterBoost)) : this.maxEnterBoost;
            this.lastEnter = performance.now();
            this.body.velocity.mult(this.enterBoost, this.body.velocity);
        }
    }
    update(dt) {
        this.actor.movement.bladeMove(dt);

        if (!this.input.actionStates.blade) {
            this.manager.setState('idle');
            return;
        }

        // Jump
        if (this.input.keys['Space']) {
            this.manager.setState('jump');
            return;
        }
        if (this.input.actionStates.dash) {
            this.manager.setState('dash');
            return;
        }
        if (!this.actor.groundChecker.isGrounded(.6)) {
            if (!this.floorTimer) {
                this.floorTimer = setTimeout(() => {
                    this.manager.setState('fall');
                    this.floorTimer = null;
                }, 300);
            }
        } else {
            clearTimeout(this.floorTimer);
            this.floorTimer = null;
        }
    }
    exit() {
        clearTimeout(this.floorTimer);
        this.floorTimer = null;
    }
}