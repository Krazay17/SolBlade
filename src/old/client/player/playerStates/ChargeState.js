import PlayerState from "./_PlayerState";

export default class ChargeState extends PlayerState {
    constructor(game, manager, actor) {
        super(game, manager, actor);
        this.weapon = null;
    }
    enter(state, { onExit }) {
        this.onExit = onExit;
    }
    update(dt) {
        this.movement.smartMove(dt);
    }
    exit() {
        if (this.onExit) this.onExit();
    }
}