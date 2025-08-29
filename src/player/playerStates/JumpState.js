import PlayerState from "./_PlayerState";

export default class JumpState extends PlayerState {
    enter() {
        if(this.body.velocity.y < 0) {
        this.body.velocity.y = 9.8;
        } else {
            this.body.velocity.y += 9.8;
        }
        this.actor.animator.setAnimState('jump');
        this.jumpTimer = performance.now() + 300;
    }
    update(dt) {
        this.airMove(dt)

        if (this.input.keys['ShiftLeft'] && this.manager.tryDash()) {
            return;
        }
        if (this.jumpTimer < performance.now()) {
            this.actor.setState('fall');
            return;
        }
    }
}