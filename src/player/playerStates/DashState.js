import PlayerState from "./_PlayerState";

export default class DashState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
    }
    enter() {
        this.actor.animator?.setAnimState('dash');
        this.timer = performance.now() + 350;
        this.actor.movement.dashStart();
    }
    update(dt) {
        this.actor.movement.dashMove(dt);
        if (this.timer < performance.now()) {
            if(this.input.actionStates.blade) {
            this.manager.setState('blade');
            return;

            } else {
                this.actor.energyRegen = 25;
                this.manager.setState('idle');
                return;
            }
        }
    }
    exit() {
        this.actor.movement.dashStop();
    }
}