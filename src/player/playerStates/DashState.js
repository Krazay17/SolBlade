import PlayerState from "./_PlayerState";

export default class DashState extends PlayerState {
    constructor(actor, manager, options = { cd: 1250 }) {
        super(actor, manager, options);
    }
    enter() {
        this.actor.animator?.setAnimState('dash');
        this.timer = performance.now() + 370;
        this.cdTimer = performance.now() + this.cd;
        this.actor.movement.dashStart();
    }
    update(dt) {
        this.actor.movement.dashMove(dt);
        if (this.timer < performance.now()) {
            this.manager.setState('idle');
            return;
        }
    }
    exit() {
        //this.actor.movement.dashStop();
    }
    canEnter() {
        return this.cdTimer < performance.now();
    }
}