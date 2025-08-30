import PlayerState from "./_PlayerState";

export default class AttackState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
    }
    enter() {
        this.timer = performance.now() + 610;
        this.airFriction = 6;
        this.actor.animator?.setAnimState('attack');
    }
    update(dt) {
        this.airMove(dt);
        this.body.velocity.y *= .98;

        if (performance.now() > this.timer) {
            this.actor.stateManager.setState('idle');
        }
    }
}