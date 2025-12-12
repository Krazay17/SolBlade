import AIController from "@solblade/server/core/AIController";
import IdleState from "@solblade/server/core/IdleState";
import PatrolState from "@solblade/server/core/PatrolState";

const stateReg = {
    idle: IdleState,
    patrol: PatrolState,
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
    controller?: new (...args: any) => {};
}

export const actorType = {
    goblin: {
        model: "Goblin",
        controller: null,
        abilities: ["slash"],
        states: stateReg,
        physics: { shape: "capsule", mass: 0.5, height: 0.8, radius: 0.3 }
    },
    player: {
        model: "PlayerMage",
        controller: null,
        abilities: ["dash", "fireball"],
        states: stateReg,
        physics: { shape: "capsule", mass: 1, height: 1, radius: 0.5 }
    },
    devil: {
        model: "devilMan",
        controller: null,
        abilities: ["slash"],
        states: stateReg,
        physics: { shape: "capsule", mass: 0.5, height: 0.8, radius: 0.3 }
    },
    wizard: {
        model: "Wizard",
        controller: AIController,
        abilities: ["fireball", "teleport"],
        states: stateReg,
        physics: { shape: "capsule", mass: 1, height: 1, radius: 0.5 }
    },
} satisfies Record<string, ActorTypeDefinition>;