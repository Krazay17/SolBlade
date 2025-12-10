import { SkeleSystem } from "@solblade/client/actors/components/SkeleSystem";
import { AbilitySystem } from "../actors/abilities/AbilitySystem";
import { Actor, ActorInint } from "../actors/Actor";
import { CameraComponent } from "../actors/components/CameraComponent";
import { RemoteInterpolation } from "../actors/components/RemoteInterpolation";
import { ReplicationSender } from "../actors/components/ReplicationSender";
import SolWorld from "./SolWorld";
import { actorType } from "../data/ActorTypeData";
import { Group } from "three";

export function spawnA<T extends keyof typeof actorType>(
    world: SolWorld,
    type: T,
    role: "local" | "remote" | "server",
    data: ActorInint,
) {
    const def = actorType[type];
    const defaults = {
        type,
        worldName: world.name,
        model: def.model,
        ...data
    }
    const actor = new Actor(defaults);

    actor.add(new def.movement(actor));

    if (role === "local") {
        if (def.controller) actor.add(new def.controller(actor));
        if (type === "player") {
            actor.add(new CameraComponent(actor));
        }
    }
    if (role === "remote") {
        const group = actor.graphics = new Group();
        actor.add(new RemoteInterpolation(actor, group));
        if (def.model && world.loader) {
            const skelesys = new SkeleSystem(actor);
            if (actor.model) skelesys.addSkele(world.loader);
            actor.add(skelesys);
        }
    }
    if (role === "server") {
        actor.add(new ReplicationSender(actor));
        if (def.abilities) {
            actor.add(new AbilitySystem(actor, def.abilities));
        }
    }

    return actor;
}