import { SkeleSystem } from "@solblade/client/actors/components/SkeleSystem";
import { AbilitySystem } from "../actors/abilities/AbilitySystem";
import Actor from "../actors/Actor";
import { CameraComponent } from "../actors/components/CameraComponent";
import { RemoteInterpolation } from "../actors/components/RemoteInterpolation";
import { ReplicationSender } from "../actors/components/ReplicationSender";
import SolWorld from "./SolWorld";
import { actorType } from "../data/ActorTypeData";

export function spawnA<T extends keyof typeof actorType>(
    world: SolWorld,
    type: T,
    role: "local" | "remote" | "server",
    data: any,
) {
    const def = actorType[type];
    const actor = new Actor(data);

    actor.add("movement", new def.movement(actor));

    if (role === "local") {
        if (def.controller) actor.add("controller", new def.controller(actor));
        if (type === "player") {
            actor.add("camera", new CameraComponent(actor));
        }
    }
    if (role === "remote") {
        actor.add("interp", new RemoteInterpolation(actor).addGroup(actor.graphics));
        if (def.model && world.loader) {
            actor.add("model", new SkeleSystem(actor).addSkele(world.loader));
        }
    }
    if (role === "server") {
        actor.add("replicator", new ReplicationSender(actor));
        if (def.abilities) {
            actor.add('abilities', new AbilitySystem(actor, def.abilities));
        }
    }

    return actor;
}