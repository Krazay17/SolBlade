import ActorManager from "@solblade/common/core/ActorManager.js";
import { NETPROTO } from "@solblade/common/core/NetProtocols";
import { serverActors } from "@solblade/common/core/Registry.js";

export class SActorManager extends ActorManager {
    constructor(game, world){
        super(world);
        this.game = game;
        this.registry = serverActors;
    }
    onNewActor(actor){
        this.game.broadcast(NETPROTO.SPAWN_ACTOR, actor.serialize());
    }
}