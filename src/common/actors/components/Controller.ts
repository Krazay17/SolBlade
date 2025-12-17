import type { Actor } from "../Actor";
import type SolWorld from "@solblade/common/core/SolWorld";

export class Controller {
    actor: Actor;
    world: SolWorld;

    yaw: number = 0;
    pitch: number = 0;

    actionStates: any;
    constructor(actor: Actor, options?: any) {
        if (actor) {
            this.actor = actor;
            this.world = actor.world;
        }
    }
    inputDirection() { }
    lookDirection() {
        const x = Math.sin(this.yaw) * Math.cos(this.pitch);
        const y = Math.sin(this.pitch);
        const z = Math.cos(this.yaw) * Math.cos(this.pitch);
        return { x, y, z }
    }
    aim() { return { dir: null, camDir: null } }
    tick(dt: number) { }
    look(y, p) { }
}