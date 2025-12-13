import AIController from "@solblade/server/core/AIController";
import { ChaseState } from "@solblade/server/core/ChaseState";
import IdleState from "@solblade/server/core/IdleState";
import PatrolState from "@solblade/server/core/PatrolState";

const stateReg = {
    idle: IdleState,
    patrol: PatrolState,
    chase: ChaseState,
}

interface PhysicsConfig {
    shape: "capsule" | "box";
    mass: number;
    height?: number;
    radius?: number;
}

interface ActorTypeDefinition {
    model?: string;
    abilities?: string[];
    states?: typeof stateReg;
    physics?: PhysicsConfig;
}

export const actorType = {
    player: {
        model: "spikeMan",
        abilities: ["dash", "fireball"],
        states: null,
        physics: { shape: "capsule", mass: 1, height: 1, radius: 0.5 }
    },
    wizard: {
        model: "Wizard",
        abilities: ["fireball", "teleport"],
        states: stateReg,
        physics: { shape: "capsule", mass: 1, height: 1, radius: 0.5 }
    },
    movingBox: {
        model: "Box",
        abilities: null,
        states: null,
        physics: { shape: "box", mass: 1, height: 1, radius: 1 }
    },
} satisfies Record<string, ActorTypeDefinition>;