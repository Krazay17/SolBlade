import { Group } from "three";
import Actor from "@solblade/common/actors/Actor";
import { CWorld } from "../world/CWorld";
import { SkeleSystem } from "./components/SkeleSystem";

export class RActor extends Actor {
    world: CWorld;
    graphics: Group;
    skeleSystem: SkeleSystem;
    constructor(world: CWorld, data = {}) {
        super(data);
        this.world = world;

        this.graphics = new Group();

    }
}