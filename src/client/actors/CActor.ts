import Actor from "@solblade/common/actors/Actor";
import { Group } from "three";
import { SkeleSystem } from "./components/SkeleSystem";
import { AbilitySystem } from "@solblade/common/actors/abilities/AbilitySystem";
import { CWorld } from "../world/CWorld";
import RAPIER from "@dimforge/rapier3d-compat";

export class CActor extends Actor {
    world: CWorld;
    graphics: Group;
    abilitySystem: AbilitySystem;
    skeleSystem: SkeleSystem;
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    constructor(world: CWorld, data = {}) {
        super(data);
        this.world = world;

        this.graphics = new Group();
        this.abilitySystem = new AbilitySystem(this);
        this.skeleSystem = new SkeleSystem();
        const {body, collider} = this.world.physics.makeCapsule();
        this.body = body;
        this.collider = collider;
    }
}