import State from "@solblade/common/actors/states/State"
import { PathFinder } from "./PathFinder";
import { Vector3 } from "three";

export class PatrolState extends State {
    accumulator: number;
    reverse: number;
    pathFinder = new PathFinder(this.actor, this.actor.world);
    targetPos = new Vector3();
    enter() {
        this.accumulator = 0;
        this.reverse = 1;
    }
    update(dt: number) {
        this.accumulator += dt;

        if (!this.targetPos || this.accumulator > 5) {
            const newSpot = this.pathFinder.findSpot(2);
            if (newSpot) {
                this.targetPos.copy(newSpot);
                this.accumulator = 0;
            }
        }

        const distance = this.actor.vecPos.distanceTo(this.targetPos);

        if (distance > 0.5) {
            const dir = new Vector3().subVectors(this.targetPos, this.actor.vecPos).normalize();

            this.movement.smartMove(dt, dir);
            this.movement.turnTo(dt, dir);
        }

    }
}