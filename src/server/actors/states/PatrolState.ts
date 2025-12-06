import State from "@solblade/server/actors/states/State"

export default class PatrolState extends State {
    accumulator: number;
    reverse: number;
    enter() {
        this.accumulator = 0;
        this.reverse = 1;
    }
    update(dt) {
        this.accumulator += dt;

        this.movement.smartMove(dt);

        if(this.accumulator > 5000) {
            this.reverse = -1;
            this.accumulator = 0;
        }
    }
}