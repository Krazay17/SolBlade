import SolWorld from "@solblade/common/core/SolWorld";
import { Actor } from "../Actor";

export class Debugger {
    actor: Actor;
    world: SolWorld;
    constructor(actor, world){
        this.actor = actor;
        this.world = world;
    }
    tick(dt){
        console.log(this.actor.pos);
    }
}