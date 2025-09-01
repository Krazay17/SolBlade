import PlayerState from "./_PlayerState";

export default class BladeState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.friction = 0;
        this.groundAccel = 3;
        this.maxGroundSpeed = 12;
    }
    enter() {
        this.actor.animator?.setAnimState('crouch', true);

        const floorDotHorz = 1 - this.actor.groundChecker.floorDot();
        this.body.velocity.mult(1 + floorDotHorz, this.body.velocity);
    }
    update(dt) {
        this.groundMove(dt);

        if (!this.input.actionStates.blade) {
            this.manager.setState('idle');
            return;
        }

        // Jump
        if (this.input.keys['Space']) {
            this.manager.setState('jump');
            return;
        }
        console.log(this.actor.groundChecker.floorDot());

        if (this.actor.groundChecker.floorDot() < 0.4) {
            this.manager.setState('fall');
            return;
        }
    }
}