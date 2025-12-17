import { MeshSystem } from "@solblade/client/actors/components/MeshSystem";
import { AbilitySystem } from "../actors/abilities/AbilitySystem";
import { Actor, ActorInit } from "../actors/Actor";
import SolWorld from "./SolWorld";
import { actorType } from "../data/ActorTypeData";
import { Group } from "three";
import FSM from "../actors/states/FSM";
import { ClientReplication } from "@solblade/client/actors/components/ClientReplication";

export function spawnA<T extends keyof typeof actorType>(
    world: SolWorld,
    type: T,
    role: "local" | "remote" | "server",
    data?: ActorInit,
) {
    const def = actorType[type];
    const init = {
        ...def,
        ...data,
        type,
        world,
        worldName: world.name,
    }
    const actor = new Actor(init);

    const isPlayer = type === "player";
    actor.replication = new ClientReplication(actor);

    if (role === "local") {
    }
    if (role === "remote") {
        const group = actor.graphics = new Group();
        group.position.copy(actor.vecPos);
        if (init.scale) group.scale.set(init.scale, init.scale, init.scale);
        world.add(group);
        actor.mesh = new MeshSystem(actor);
        if (init.model) {
            actor.mesh.addMesh(world.loader, init.model);
        }
        world.physics.makeBody(actor, def.physics, def.scale, false);
    }
    if (role === "server") {
        if (def.controller) actor.controller = new def.controller.cls(actor, world, def.controller.options)
        if (def.movement) actor.movement = new def.movement.cls(actor, def.movement.options);
        if (def.states) actor.fsm = new FSM(actor, def.states);
        if (def.abilities) actor.add(new AbilitySystem(actor, def.abilities));
        world.physics.makeBody(actor, def.physics, def.scale, isPlayer);
    }
    world.addActor(actor);
    return actor;
}