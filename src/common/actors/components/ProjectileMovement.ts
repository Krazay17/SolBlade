import { Vector3 } from "three";
import { Component } from "./_Component";
import { SOL_PHYSICS_SETTINGS } from "@solblade/common/data/SolConstants";
import { Actor } from "../Actor";

interface ProjectileConfig {
    speed?: number;
    velocity?: Vector3;
    gravity?: number;
}

export class ProjectileMovement extends Component {
    speed: number;
    velocity: Vector3;
    gravity: Vector3 = new Vector3().copy(SOL_PHYSICS_SETTINGS.gravity);
    constructor(actor: Actor, options?: ProjectileConfig) {
        super(actor);
        this.speed = options.speed ?? 10
        this.velocity = options.velocity ?? actor.vecRot.multiplyScalar(this.speed);
        this.gravity.y = options.gravity ? options.gravity : this.gravity.y;
    }
    tick(dt: number) {
        
    }
}