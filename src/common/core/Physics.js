import RAPIER from "@dimforge/rapier3d-compat";
import { COLLISION_GROUPS, SOL_PHYSICS_SETTINGS } from "../config/SolConstants.js";

export class Physics {
    constructor() {
        this.world = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);
    }
    remove() {
        this.world.free();
    }
    step(dt) {
        this.world.step();
    }
    async makeWorld(name) {
        let worldData;
        //     const { loadJson } = await import("@solblade/common/utils/LoadJson.js");
        //     worldData = await loadJson(`../worlds/${name}.json`)
        const worldModule = await import(`../worlds/${name}.json`);
        worldData = worldModule.default;
        if (!worldData) return;
        const colliders = colliderFromJson(worldData);
        for (const { vertices, indices } of colliders) {
            const desc = RAPIER.ColliderDesc.trimesh(vertices, indices);
            desc.setCollisionGroups(COLLISION_GROUPS.WORLD << 16 | (COLLISION_GROUPS.ENEMY | COLLISION_GROUPS.PLAYER));

            this.world.createCollider(desc);
        }
    }
}
function colliderFromJson(data) {
    const colliders = [];
    for (const obj of data) {
        if (!obj.vertices?.length || !obj.indices?.length) {
            console.warn("Skipping object with missing vertices or indices:", obj.name);
            continue;
        }

        // Filter vertices to ensure each has 3 numbers
        const filteredVerts = obj.vertices.filter(v => Array.isArray(v) && v.length === 3);
        if (filteredVerts.length === 0) {
            console.warn("Skipping object with no valid vertices:", obj.name);
            continue;
        }

        const vertices = new Float32Array(filteredVerts.flat());

        // Flatten indices
        const indices = new Uint32Array(obj.indices.flat());
        const maxIndex = Math.max(...indices);
        if (maxIndex >= vertices.length / 3) {
            console.warn("Skipping object with indices out of bounds:", obj.name);
            continue;
        }

        colliders.push({ vertices, indices });
    }
    return colliders;
}