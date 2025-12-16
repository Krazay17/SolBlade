import { Vector3 } from "three";
import type { Actor } from "../Actor";
import type SolWorld from "@solblade/common/core/SolWorld";

export interface ControllerOptions {
    aggroRange?: number;
}
export class Controller {
    actor: Actor;
    world: SolWorld;
    direction: Vector3 = new Vector3();
    actionStates: any;
    constructor(actor: Actor, world: SolWorld, data?: ControllerOptions) {
        this.actor = actor;
        this.world = world;
     }
    inputDirection(): Vector3 | boolean { return this.direction }
    aim() { return { dir: null, camDir: null } }
    tick(dt: number) { }
    look(y, p) { }
}