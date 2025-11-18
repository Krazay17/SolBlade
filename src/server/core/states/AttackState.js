import State from "./State.js";

export default class AttackState extends State {
    enter(prevState, ability) {
        super.enter(prevState);

        const {
            delay = 500,      // ms until the ability actually fires
            duration = 1000,  // total duration of the attack state
            anim = 'Attack',
        } = ability;

        this.ability = ability;
        this.delay = delay;
        this.duration = duration;

        this.elapsed = 0;
        this.fired = false;

        this.pawn.movement.stop();
        this.pawn.setAnim?.(anim);
    }

    update(dt) {
        this.elapsed += dt * 1000

        // fire ability after delay
        if (!this.fired && this.elapsed >= this.delay && this.ability) {
            this.ability.execute();
            this.fired = true;
        }

        // exit state after duration
        if (this.elapsed >= this.duration) {
            this.fsm.setState('chase'); // or whatever the next state is
        }
    }

    exit(nextState) {
        // optional cleanup
        this.ability = null;
        this.fired = false;
    }
}