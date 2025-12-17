import State from "@solblade/common/actors/states/State";
import {AIController} from "./AIController";
import { AbilitySystem } from "@solblade/common/actors/abilities/AbilitySystem";

export class ChaseState extends State {
    update(dt: any): void {
        const target = (this.actor.controller as AIController)?.blackboard.player;
        if (target) {
            const dir = target.vecPos.sub(this.actor.vecPos).normalize();
            this.movement.turnTo(dt, dir);
            this.movement.smartMove(dt, dir);

            const ab = this.actor.get(AbilitySystem);
            if(ab)ab.useRandom();
        }
    }
}