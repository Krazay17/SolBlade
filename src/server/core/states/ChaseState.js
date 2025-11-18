import State from "./State.js";

export default class ChaseState extends State {
    constructor(game, pawn, data) {
        super(game, pawn, data);
    }
    enter(prevState){
        super.enter(prevState);
        this.pawn.setAnim('Fwd')
    }
    update(dt) {
        const { player, dir, dist } = this.blackboard;

        if (!player) {
            this.fsm.setState('idle');
            return;
        }
        this.movement.move(dt, dir);

        if (dist < 5) {
            this.rangeAction('close');
        } else if (dist < 10) {
            this.rangeAction('med');
        } else if (dist < 15) {
            this.rangeAction('far');
        }
    }
    rangeAction(range) {
        const actions = this.pawn.rangeActions[range];
        if (!actions) return
        actions[0].execute?.();
    }
}