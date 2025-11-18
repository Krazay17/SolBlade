import SActor from "../../actors/SActor.js";
import SGame from "../../SGame.js";

export default class SAbility {
    constructor(data = {}) {
        const {
            name = 'ability',
            state = 'attack',
            cd = 0,
            duration = 2000,
            delay = 0,
            canInterrupt = false,
            anim = "Attack",
            range = Infinity,
        } = data;

        this.name = name;
        this.state = state;
        this.cd = cd;
        this.duration = duration;
        this.canInterrupt = canInterrupt;
        this.range = range;
        this.delay = delay;
        this.anim = anim;

        this.lastUsed = 0;
    }
    canUse(range) {
        return (this.lastUsed + this.cd < performance.now()) &&
            range <= this.range;
    }
    start(actor) {
        this.lastUsed = performance.now();
        if (!this.delay) this.execute();
    }
    execute() {
    }
}