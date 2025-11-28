import ActorManager from "@solblade/common/core/ActorManager";
import { clientActors } from "../core/CRegistry";
import CSolWorld from "../worlds/CSolWorld";

export class CActorManager extends ActorManager {
    /**
     * 
     * @param {CSolWorld} world 
     */
    constructor(world) {
        super(world, clientActors);
    }
}