import PlayerState from "./_PlayerState";

export default class DashState extends PlayerState {
    constructor(actor, manager, options = { cd: 1250 }) {
        super(actor, manager, options);
        this.cdTimer = 0;
    }
    enter() {
        this.actor.animator?.setAnimState('dash');
        this.timer = performance.now() + 370;
        this.cdTimer = performance.now() + this.cd;
        this.getInputDirection(-1);
        this.dashSpeed = 25;
    }
    update(dt) {
        super.update(dt);
        this.direction.y = 0;
        this.dashSpeed -= 60 * dt;
        const dashVelocity = this.direction.scale(this.dashSpeed);
        this.body.velocity.copy(dashVelocity);
        if (this.timer < performance.now()) {
            this.manager.setState('idle');
            return;
        }
    }
    exit() {
        const currentVel = this.body.velocity.clone();
        currentVel.mult(0.4, this.body.velocity);
    }
    canEnter() {
        return this.cdTimer < performance.now();
    }
}