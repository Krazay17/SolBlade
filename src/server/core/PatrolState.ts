import State from "@solblade/common/actors/states/State"
import AIController from "./AIController";

export default class PatrolState extends State {
    accumulator: number;
    reverse: number;
    enter() {
        this.accumulator = 0;
        this.reverse = 1;
    }
    update(dt) {
        this.accumulator += dt;
        const con = this.actor.get(AIController);
        if (con) this.movement.smartMove(dt, con.inputDirection());

        if (this.accumulator > 5000) {
            this.reverse = -1;
            this.accumulator = 0;
        }
    }
}