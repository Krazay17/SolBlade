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
import { ClientReplication } from "@solblade/client/actors/components/ClientReplication";
import AIController from "@solblade/server/core/AIController";

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
    actor.replication = new ClientReplication(actor);

    if (role === "local") {
        if (type === "player") {
            //actor.add(new CameraComponent(actor));
        }
    }
    if (role === "remote") {
        actor.graphics = new Group();
        if (def.model && world.loader) {
            const skelesys = new SkeleSystem(actor);
            skelesys.addSkele(world.loader);
            actor.animation = skelesys;
        }
    }
    if (role === "server") {
        if (type !== "player") {
            actor.controller = new AIController(this, world);
            actor.movement = new Movement(actor);
            actor.fsm = new FSM(actor, def.states);
            if (def.abilities) actor.add(new AbilitySystem(actor, def.abilities));
        } else {
        }
        const { body, collider } = world.physics.makeCapsule(def.physics.height, def.physics.radius);
        body.setTranslation(actor.vecPos, true);
        actor.body = body;
        actor.collider = collider;
    }
    return actor;
}