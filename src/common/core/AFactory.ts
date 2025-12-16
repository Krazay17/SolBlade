import { SkeleSystem } from "@solblade/client/actors/components/SkeleSystem";
import { AbilitySystem } from "../actors/abilities/AbilitySystem";
import { Actor, ActorInint } from "../actors/Actor";
import SolWorld from "./SolWorld";
import { actorType } from "../data/ActorTypeData";
import { Group } from "three";
import FSM from "../actors/states/FSM";
import { ClientReplication } from "@solblade/client/actors/components/ClientReplication";

export function spawnA<T extends keyof typeof actorType>(
    world: SolWorld,
    type: T,
    role: "local" | "remote" | "server",
    data: ActorInint,
) {
    const def = actorType[type];
    const defaults = {
        ...data,
        type,
        world,
        worldName: world.name,
        model: def.model ?? data.model,
    }
    const actor = new Actor(defaults);
    actor.replication = new ClientReplication(actor);

    if (role === "local") {
    }
    if (role === "remote") {
        const group = actor.graphics = new Group();
        world.add(group);
        actor.animation = new SkeleSystem(actor);
        actor.animation.addSkele(world.loader);
        world.physics.makeBody(actor, def.physics, true);
    }
    if (role === "server") {
        if (def.controller) actor.controller = new def.controller.cls(actor, world, def.controller.options)
        if (def.movement) actor.movement = new def.movement.cls(actor, def.movement.options);
        if (def.states) actor.fsm = new FSM(actor, def.states);
        if (def.abilities) actor.add(new AbilitySystem(actor, def.abilities));
        world.physics.makeBody(actor, def.physics);
    }
    return actor;
}