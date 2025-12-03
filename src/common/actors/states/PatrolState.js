import State from "./State.js";

export default class PatrolState extends State {
    enter() {
        this.accumulator = 0;
        this.reverse = 1;
    }
    update(dt) {
        this.accumulator += dt;

        this.movement.smartMove(dt, this.pawn.vecDir);

        if(this.accumulator > 5000) {
            this.reverse = -1;
            this.accumulator = 0;
        }
    }
}