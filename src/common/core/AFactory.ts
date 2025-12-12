import { SkeleSystem } from "@solblade/client/actors/components/SkeleSystem";
import { AbilitySystem } from "../actors/abilities/AbilitySystem";
import { Actor, ActorInint } from "../actors/Actor";
import { CameraComponent } from "../actors/components/CameraComponent";
import { RemoteInterpolation } from "../../client/actors/components/RemoteInterpolation";
import SolWorld from "./SolWorld";
import { actorType } from "../data/ActorTypeData";
import { Group } from "three";
import { Movement } from "../actors/components/Movement";
import FSM from "../actors/states/FSM";
import { ServerInterpolation } from "@solblade/server/core/ServerInterpolation";
import { NetworkSync } from "../actors/components/NetSync";

export function spawnA<T extends keyof typeof actorType>(
    world: SolWorld,
    type: T,
    role: "local" | "remote" | "server",
    data: ActorInint,
) {
    const def = actorType[type];
    const defaults = {
        type,
        world,
        worldName: world.name,
        model: def.model,
        ...data
    }
    const actor = new Actor(defaults);

    actor.add(new NetworkSync(actor))

    if (role === "local") {
        if (type === "player") {
            //actor.add(new CameraComponent(actor));
        }
    }
    if (role === "remote") {
        const group = actor.graphics = new Group();
        actor.add(new RemoteInterpolation(actor, group));
        if (def.model && world.loader) {
            const skelesys = new SkeleSystem(actor);
            skelesys.addSkele(world.loader);
            actor.animation = skelesys;
        }
    }
    if (role === "server") {
        if (type !== "player") {
            if (def.controller) actor.controller = new def.controller(actor, world);
            actor.movement = new Movement(actor);
            actor.fsm = new FSM(actor, def.states);
            if (def.abilities) actor.add(new AbilitySystem(actor, def.abilities));
            actor.add(new ServerInterpolation(actor));
        } else {
            //actor.add(new ServerInterpolation(actor, true));
        }
        const { body, collider } = world.physics.makeCapsule(def.physics.height, def.physics.radius)
        actor.body = body;
        actor.collider = collider;
    }
    return actor;
}