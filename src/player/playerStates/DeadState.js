import PlayerState from "./_PlayerState";

export default class DeadState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
    }
    enter() {
        this.actor.animator?.setAnimState('dead');
        this.body.velocity.set(0, 0, 0);
    }
    update(dt) {
        // Handle dead-specific logic here
        console.log("Player is dead");
    }
}