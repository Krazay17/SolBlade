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
        // We update the arrays directly or via your getters/setters if you prefer
        this.actor.pos[0] = t.x;
        this.actor.pos[1] = t.y;
        this.actor.pos[2] = t.z;

        this.actor.rot[0] = r.x;
        this.actor.rot[1] = r.y;
        this.actor.rot[2] = r.z;
        this.actor.rot[3] = r.w;

        // 3. Sync to Visuals (Graphics)
        // This ensures the 3D model snaps to the physics body every frame
        // if (this.actor.graphics) {
        //     this.actor.graphics.position.set(t.x, t.y, t.z);
        //     this.actor.graphics.quaternion.set(r.x, r.y, r.z, r.w);
        // }
    }

    /**
     * Call this when you need to FORCE the body to move (e.g. respawning, 
     * initial spawn, or network snapping).
     * Do not just set actor.pos manually, or physics will overwrite it next frame.
     */
    teleport(pos: number[], rot?: number[]) {
        if (!this.actor.body) return;

        // Update Physics Body (The Source of Truth)
        this.actor.body.setTranslation({ x: pos[0], y: pos[1], z: pos[2] }, true);
        if (rot) {
            this.actor.body.setRotation({ x: rot[0], y: rot[1], z: rot[2], w: rot[3] }, true);
        }

        // Force an immediate tick so graphics don't lag one frame behind
        this.tick(0);
    }
}