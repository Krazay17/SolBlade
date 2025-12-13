import State from "@solblade/common/actors/states/State";
import AIController from "./AIController";

export class ChaseState extends State {
    update(dt: any): void {
        const target = this.actor.get(AIController)?.blackboard.player;
        if (target) {
            const dir = target.vecPos.sub(this.actor.vecPos).normalize();
            this.movement.turnTo(dt, dir);
            this.movement.smartMove(dt, dir);
        }
    }
}