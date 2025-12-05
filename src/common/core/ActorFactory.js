import { CActor } from "@solblade/client/actors/CActor";
import { RActor } from "@solblade/client/actors/RActor";
import { SActor } from "../actors/SActor";
import { actorType } from "../actors/TypeData";

export function spawnActor(world, type, role) {
    const typeData = actorType[type];

    let actor;
    switch (role) {
        case "local":
            actor = new CActor();
            if (typeData.abilities) actor.abilitySystem.addAbilities(typeData.abilities);
            if (typeData.mesh) actor.skeleSystem.addSkele(world.loader, typeData.mesh);
            break;
        case "server":
            actor = new SActor();
            if (typeData.abilities) actor.abilitySystem.addAbilities(typeData.abilities);
            break;
        case "remote":
            actor = new RActor();
            if (typeData.mesh) actor.skeleSystem.addSkele(world.loader, typeData.mesh);
            break
        default:
            console.warn(`no role: ${role}`);
    }
    actor.type = type;

    return actor;
}

