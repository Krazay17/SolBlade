import Actor from "@solblade/common/actors/Actor";
import { Group } from "three";
import { SkeleSystem } from "./components/SkeleSystem";
import { AbilitySystem } from "@solblade/common/actors/abilities/AbilitySystem";
import { CWorld } from "../world/CWorld";
import RAPIER from "@dimforge/rapier3d-compat";
import { PhysicsActor } from "@solblade/common/core/Interfaces";
import { Movement } from "@solblade/common/actors/components/Movement";
import { ActorUpdate } from "./components/ActorUpdate";

export class CActor extends Actor implements PhysicsActor {
    world: CWorld;
    graphics: Group;
    abilitySystem: AbilitySystem;
    skeleSystem: SkeleSystem;
    body: RAPIER.RigidBody | null = null;
    collider: RAPIER.Collider | null = null;
    movement: Movement;
    actorUpdate: ActorUpdate;
    constructor(world: CWorld, data = {}) {
        super(data);
        this.world = world;

        this.graphics = new Group();
        this.abilitySystem = new AbilitySystem(this);
        this.skeleSystem = new SkeleSystem(this);
        this.movement = new Movement(this);
        this.actorUpdate = new ActorUpdate(this);
    }
    tick(dt) { }
    setId(id) {
        this.id = id;
        console.log(id);
    }
}