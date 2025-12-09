import { Group, Vector3 } from "three";
import Actor from "@solblade/common/actors/Actor";
import { CWorld } from "../world/CWorld";
import { SkeleSystem } from "./components/SkeleSystem";
import { ActorUpdate } from "./components/ActorUpdate";

export class RActor extends Actor {
    world: CWorld;
    graphics: Group;
    skeleSystem: SkeleSystem;
    actorUpdate: ActorUpdate;
    _vecPos: Vector3;
    constructor(world: CWorld, data = {}) {
        super(data);
        this.world = world;

        this.graphics = new Group();
        this.world.add(this.graphics);
        this.actorUpdate = new ActorUpdate(this);
        this.skeleSystem = new SkeleSystem(this);
    }
    get vecPos() {
        if (!this._vecPos) return this._vecPos = new Vector3().fromArray(this.pos);
        return this._vecPos.fromArray(this.pos);
    }
    tick(dt: number) {
        const dist = this.graphics.position.distanceTo(this.vecPos);
        if (dist > 0.001) {
            if (dist < 25) this.graphics.position.lerp(this.vecPos, dt * 60);
            else this.graphics.position.copy(this.vecPos);
        }
    }
}