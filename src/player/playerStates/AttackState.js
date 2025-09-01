import PlayerState from "./_PlayerState";

export default class AttackState extends PlayerState {
    constructor(actor, manager, options = {}) {
        super(actor, manager, options);
        this.weapon = null;
    }
    enter({ weapon, anim }) {
        this.weapon = weapon;
        this.timer = performance.now() + 610;
        this.airFriction = 6;
        this.actor.animator?.setAnimState(anim);
    }
    update(dt) {
        this.airMove(dt);
        this.body.velocity.y *= .98;

        this.weapon.update();

        if (performance.now() > this.timer) {
            this.actor.stateManager.setState('idle');
        }
    }
}