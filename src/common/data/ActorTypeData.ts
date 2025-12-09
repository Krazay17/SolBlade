import AIController from "@solblade/server/core/AIController";
import { Movement } from "../actors/components/Movement";
import Actor from "../actors/Actor";

interface PhysicsConfig {
    shape: "capsule" | "box";
    mass: number;
    height?: number;
    radius?: number;
}

interface ActorTypeDefinition {
    movement: new (actor: Actor) => any;
    controller?: new (actor: Actor) => any; // only used for local actors
    model?: string;
    abilities?: string[];
    physics?: PhysicsConfig;
}

export const actorType = {
    wizard: {
        movement: Movement,
        controller: AIController,
        model: "Wizard",
        abilities: ["fireball", "teleport"],
        physics: { shape: "capsule", mass: 1, height: 1, radius: 0.5 }
    },

    goblin: {
        movement: Movement,
        controller: AIController,
        model: "Goblin",
        abilities: ["slash"],
        physics: { shape: "capsule", mass: 0.5, height: 0.8, radius: 0.3 }
    },

    player: {
        movement: Movement,
        controller: null,
        model: "PlayerMage",
        abilities: ["dash", "fireball"],
        physics: { shape: "capsule", mass: 1, height: 1, radius: 0.5 }
    },
    devil: {
        movement: Movement,
        controller: AIController,
        model: "devilMan",
        abilities: ["slash"],
        physics: { shape: "capsule", mass: 0.5, height: 0.8, radius: 0.3 }
    }
} satisfies Record<string, ActorTypeDefinition>;