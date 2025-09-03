import PlayerState from "./_PlayerState";

export default class DeadState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
    }
    enter() {
        this.actor.animator?.setAnimState('knockback');
        this.actor.isDead = true;

        setTimeout(() => {
            this.actor.isDead = false;
            this.actor.unDie();
        }, 2500);
    }
    update(dt) {
        // Handle dead-specific logic here
    }
    exit() {
        this.actor.isDead = false;
    }
    canEnter() {
        return !this.actor.isDead;
    }
    canExit() {
        return !this.actor.isDead;
    }
}