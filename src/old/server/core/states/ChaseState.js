import State from "./State.js";

export default class ChaseState extends State {
    constructor(game, pawn, data) {
        super(game, pawn, data);
    }
    enter(prevState) {
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
        
        this.tryAttack(dist);
    }

}