import SolWorld from "@solblade/common/core/SolWorld";
import { Actor } from "../Actor";

export class Component {
    actor: Actor;
    world: SolWorld;
    constructor(actor: Actor) {
        this.actor = actor;
        this.world = actor.world;
    }
}