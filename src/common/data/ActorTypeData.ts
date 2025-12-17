import { AIController, AIControllerOptions } from "@solblade/server/actors/AIController";
import { ChaseState, IdleState, PatrolState } from "@solblade/server/actors";
import { Controller } from "../actors/components/Controller";
import { Movement, MovementOptions } from "../actors/components/Movement";
import { PhysicsConfig } from "../core/Physics";

const stateReg = {
    idle: IdleState,
    patrol: PatrolState,
    chase: ChaseState,
}
interface ControllerConfig {
    cls?: typeof Controller;
    options?: AIControllerOptions;
}
interface MovementConfig {
    cls?: typeof Movement;
    options?: MovementOptions;
}
interface ActorTypeDefinition {
    controller?: ControllerConfig;
    movement?: MovementConfig;
    model?: string;
    scale?: number;
    abilities?: string[];
    states?: typeof stateReg;
    physics?: PhysicsConfig;
}

export const actorType: Record<string, ActorTypeDefinition> = {
    player: {
        model: "spikeMan",
        physics: { shape: "pawn", radius: .5 }
    },
    wizard: {
        controller: {
            cls: AIController,
            options: {
                aggroRadius: 200,
            }
        },
        movement: {
            cls: Movement,
            options: {
                ground: {
                    max: 1,
                }
            }
        },
        model: "Wizard",
        abilities: ["fireball", "teleport"],
        states: stateReg,
        physics: {
            shape: "pawn",
            radius: .5,
        },
    },
    box: {
        model: "Box",
        physics: { shape: "box" },
        scale: 2
    },
    projectile: {
        movement: { cls: Movement, },
        model: "Ball",
        physics: { shape: "ball" },
        scale: .2
    }
};