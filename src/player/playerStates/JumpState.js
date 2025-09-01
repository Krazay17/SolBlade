import PlayerState from "./_PlayerState";

export default class JumpState extends PlayerState {
    enter() {
        if (this.body.velocity.y < 0) {
            this.body.velocity.y = 9.8;
        } else {
            this.body.velocity.y += 9.8;
        }
        this.actor.animator?.setAnimState('jump');
        this.jumpTimer = performance.now() + 300;
    }
    update(dt) {
        this.airMove(dt)

        if (this.jumpTimer < performance.now()) {
            this.manager.setState('idle');
            return;
        }
        if (this.input.keys['KeyE']) {
            this.manager.setState('dash')
            return;
        }
    }
}