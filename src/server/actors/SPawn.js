import SActor from "./SActor.js";

export default class SPawn extends SActor {
    constructor(game, data) {
        super(game, data);
        this.controller = null;
    }
    update(dt, time) {
        super.update(dt);
        if (this.controller) this.controller.update(dt, time);
    }
}