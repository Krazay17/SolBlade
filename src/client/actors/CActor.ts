import Actor from "@solblade/common/actors/Actor";
import { Group } from "three";
import { SkeleSystem } from "./components/SkeleSystem";
import { AbilitySystem } from "@solblade/common/actors/abilities/AbilitySystem";
import { CWorld } from "../world/CWorld";
import RAPIER from "@dimforge/rapier3d-compat";
import { PhysicsActor } from "@solblade/common/core/Interfaces";
import { Movement } from "@solblade/common/actors/components/Movement";

export class CActor extends Actor implements PhysicsActor {
    world: CWorld;
    graphics: Group;
    abilitySystem: AbilitySystem;
    skeleSystem: SkeleSystem;
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    movement: Movement;
    constructor(world: CWorld, data = {}) {
        super(data);
        this.world = world;

        this.graphics = new Group();
        this.abilitySystem = new AbilitySystem(this);
        this.skeleSystem = new SkeleSystem();
        this.movement = null;
        const { body, collider } = this.world.physics.makeCapsule();
        body.setTranslation({ x: this.pos[0], y: this.pos[1], z: this.pos[2] }, false);
        this.body = body;
        this.collider = collider;
    }
}