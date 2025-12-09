import { Collider, RigidBody, World } from "@dimforge/rapier3d-compat";
import { Movement } from "../actors/components/Movement";
import Controller from "../actors/components/Controller";
import { UserInput } from "@solblade/client/core/UserInput";
import AIController from "@solblade/server/core/AIController";
import { SkeleSystem } from "@solblade/client/actors/components/SkeleSystem";

export interface PhysicsActor {
    body: RigidBody;
    collider: Collider;
    movement: Movement;
    world: {
        physics: {
            world: World;
        }
    }
    pos: number[];
    rot: number[];
    radius: number;
}

export interface Pawn<C = Controller> {
    physics: PhysicsActor;
    controller: C;
    movement: Movement;
    animation: SkeleSystem | null;
    aim: any;
}
export type Player = Pawn<UserInput>