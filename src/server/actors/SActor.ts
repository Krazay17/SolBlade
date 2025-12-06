import { AbilitySystem } from "@solblade/common/actors/abilities/AbilitySystem.js";
import Actor from "@solblade/common/actors/Actor.js";
import { SWorld } from "../world/SWorld";
import AIMovement from "./components/AIMovement";
import { Movement } from "@solblade/common/actors/components/Movement";
import RAPIER from "@dimforge/rapier3d-compat";

export class SActor extends Actor {
    world: SWorld;
    movement: Movement | AIMovement;
    abilitySystem: AbilitySystem;
    body: RAPIER.RigidBody;
    constructor(world, data) {
        super(data);
        this.world = world;

        this.movement = null;
        this.abilitySystem = new AbilitySystem(this);
    }
}