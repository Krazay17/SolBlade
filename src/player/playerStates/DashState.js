import PlayerState from "./_PlayerState";

export default class DashState extends PlayerState {
    constructor(actor, manager, options = { cd: 1500 }) {
        super(actor, manager, options);
    }
    enter() {
        this.actor.animator.setAnimState('dash');
        this.timer = performance.now() + 370;
        this.getInputDirection(-1);
        this.dashSpeed = 25;
    }
    update(dt) {
        super.update(dt);
        this.direction.y = 0;
        this.dashSpeed -= 55 * dt;
        const dashVelocity = this.direction.scale(this.dashSpeed);
        this.body.velocity.copy(dashVelocity);
        if (this.timer < performance.now()) {
            this.manager.setState('idle');
            return;
        }
    }
    exit() {
        const curVel = this.body.velocity;
        curVel.mult(0.4, this.body.velocity);
    }
}