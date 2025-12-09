import { CActor } from "@solblade/client/actors/CActor";
import { RActor } from "@solblade/client/actors/RActor";
import { SActor } from "@solblade/server/actors/SActor";
import { actorType } from "../data/ActorData";
import Actor from "../actors/Actor";

export function spawnActor(world: any, type: string, role: string, data: Actor) {
    data.type = type;
    const typeData = actorType[type];

    let actor;
    switch (role) {
        case "local":
            actor = new CActor(world, data);
            if (typeData.abilities) actor.abilitySystem?.addAbilities(typeData.abilities);
            //if (typeData.mesh) actor.skeleSystem?.addSkele(world.loader, typeData.mesh);
            break;
        case "server":
            actor = new SActor(world, data);
            if (typeData.abilities) actor.abilitySystem?.addAbilities(typeData.abilities);
            break;
        case "remote":
            actor = new RActor(world, data);
            //if (typeData.mesh) actor.skeleSystem?.addSkele(world.loader, typeData.mesh);
            break
        default:
            console.warn(`no role: ${role}`);
    }
    actor.type = type;

    return actor;
}

