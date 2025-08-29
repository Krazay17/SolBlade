import PlayerState from "./_PlayerState";

export default class KnockbackState extends PlayerState {
    enter(dir) {
        dir.mult(35, this.body.velocity);
        this.timer = performance.now() + 800;
        this.actor.animator.setAnimState('knockBack');
    }
    update(dt) {
        if (this.timer > performance.now()) return;
        this.actor.setState('idle');
        return;
    }
}