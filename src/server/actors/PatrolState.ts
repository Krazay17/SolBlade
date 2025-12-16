import State from "@solblade/common/actors/states/State"

export class PatrolState extends State {
    accumulator: number;
    reverse: number;
    enter() {
        this.accumulator = 0;
        this.reverse = 1;
    }
    update(dt) {
        this.accumulator += dt;
        //this.movement.smartMove(dt, this.actor.vecRot);

        if (this.accumulator > 5000) {
            this.reverse = -1;
            this.accumulator = 0;
        }
    }
}