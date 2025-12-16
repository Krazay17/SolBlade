import { AIController } from "@solblade/server/actors/AIController";
import { ChaseState, IdleState, PatrolState } from "@solblade/server/actors";
import { Controller, ControllerOptions } from "../actors/components/Controller";
import { Movement, movementStateData } from "../actors/components/Movement";
import { PhysicsConfig } from "../core/Physics";

const stateReg = {
    idle: IdleState,
    patrol: PatrolState,
    chase: ChaseState,
}
interface ControllerConfig {
    cls?: typeof Controller;
    options?: ControllerOptions;
}
interface MovementConfig {
    cls?: typeof Movement;
    options?: movementStateData;
}
interface ActorTypeDefinition {
    controller?: ControllerConfig;
    movement?: MovementConfig;
    model?: string;
    abilities?: string[];
    states?: typeof stateReg;
    physics?: PhysicsConfig;
}

export const actorType: Record<string, ActorTypeDefinition> = {
    player: {
        physics: { shape: "capsule" }
    },
    wizard: {
        controller: {
            cls: AIController,
            options: {
                aggroRange: 20,
            }
        },
        movement: {
            cls: Movement,

        },
        model: "Wizard",
        abilities: ["fireball", "teleport"],
        states: stateReg,
    },
    box: {
        model: "Box",
        physics: { shape: "box", mass: 1, height: 1, radius: 1 }
    }
};