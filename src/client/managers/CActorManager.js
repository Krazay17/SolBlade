import ActorManager from "@solblade/common/core/ActorManager.js";
import { clientActors } from "../core/CRegistry.js";
import CSolWorld from "../worlds/CSolWorld.js";

export class CActorManager extends ActorManager {
    /**
     * 
     * @param {CSolWorld} world 
     */
    constructor(game, world) {
        //@ts-ignore
        super(world);
        this.game = game
        this.registry = clientActors;
    }
}