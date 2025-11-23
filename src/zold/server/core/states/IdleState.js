import State from "./State.js";

export default class IdleState extends State {
    constructor(game, pawn, data) {
        super(game, pawn, {
            ...data,
            name: "idle",
        });
    }
    enter(prevState) {
        super.enter(prevState);
        this.pawn.setAnim('Idle');
    }
    update(dt) {
        const { player } = this.pawn.controller.blackboard;
        if (player) {
            this.fsm.setState('chase');
        }
    }
}