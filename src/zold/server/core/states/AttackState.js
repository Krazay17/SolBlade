import State from "./State.js";

export default class AttackState extends State {
    constructor(game, pawn, data) {
        super(game, pawn, data);
        const {
            anim = "Attack1",
            range = Infinity,
        } = data;
        this.anim = anim;
        this.range = range;
    }
    enter(prevState, params) {
        super.enter();
        this.pawn.setAnim?.(this.anim);
    }

    update(dt) {
        this.elapsed += dt * 1000;

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
        this.elapsed = 0;
    }
    canEnter(dist) {
        if (dist) {
            return super.canEnter() && dist <= this.range;
        } else {
            return super.canEnter();
        }
    }
}