import { Actor } from "../Actor";

export class PhysicsSync {
    actor: Actor;

    constructor(actor: Actor) {
        this.actor = actor;
    }

    tick(dt: number) {
        if (!this.actor.body) return;

        // 1. Get the authoritative answer from the Physics Engine
        const t = this.actor.body.translation();
        const r = this.actor.body.rotation();

        // 2. Sync to Actor Data (The Arrays)
        this.actor.pos[0] = t.x;
        this.actor.pos[1] = t.y;
        this.actor.pos[2] = t.z;

        this.actor.rot[0] = r.x;
        this.actor.rot[1] = r.y;
        this.actor.rot[2] = r.z;
        this.actor.rot[3] = r.w;

    }
    teleport(pos: number[], rot?: number[]) {
        if (!this.actor.body) return;

        this.actor.body.setTranslation({ x: pos[0], y: pos[1], z: pos[2] }, true);
        if (rot) {
            this.actor.body.setRotation({ x: rot[0], y: rot[1], z: rot[2], w: rot[3] }, true);
        }

        // Force an immediate tick so graphics don't lag one frame behind
        this.tick(0);
    }
}