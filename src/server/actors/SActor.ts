import { AbilitySystem } from "@solblade/common/actors/abilities/AbilitySystem.js";
import Actor from "@solblade/common/actors/Actor.js";
import { SWorld } from "../world/SWorld";
import { Movement } from "@solblade/common/actors/components/Movement";
import RAPIER from "@dimforge/rapier3d-compat";
import { PhysicsActor } from "@solblade/common/core/Interfaces";
import Controller from "@solblade/common/actors/components/Controller";

export class SActor extends Actor implements PhysicsActor {
    world: SWorld;
    controller: Controller;
    movement: Movement;
    abilitySystem: AbilitySystem;
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    constructor(world, data) {
        super(data);
        this.world = world;

        this.controller = null;
        this.movement = null;
        this.abilitySystem = new AbilitySystem(this);

    }
}