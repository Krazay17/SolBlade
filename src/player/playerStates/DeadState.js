import PlayerState from "./_PlayerState";

export default class DeadState extends PlayerState {
    enter() {
        this.actor.animationManager?.playAnimation('knockback', false);
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