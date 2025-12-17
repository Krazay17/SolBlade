import RAPIER from "@dimforge/rapier3d-compat";
import { Actor } from "@solblade/common/actors/Actor";
import SolWorld from "@solblade/common/core/SolWorld";
import { Vector3 } from "three";

export class PathFinder {
    actor: Actor;
    world: SolWorld;
    pworld: RAPIER.World;
    downVec = new Vector3(0, -1, 0);

    constructor(actor: Actor, world: SolWorld) {
        this.actor = actor;
        this.world = world;
        this.pworld = world.physics.world;

    }
    findSpot(radius: number = 2) {
        const pos = this.actor.vecPos.clone();
        pos.x += (1 - Math.random() * 2) * radius;
        pos.z += (1 - Math.random() * 2) * radius;

        const ray = new RAPIER.Ray(pos, this.downVec);
        const result = this.pworld.castRay(ray, 2, false);
        if(result){
            const hitpos = pos.addScaledVector(this.downVec, result.timeOfImpact);
            return hitpos;
        }
    }
}