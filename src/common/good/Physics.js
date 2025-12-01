import RAPIER from "@dimforge/rapier3d-compat";
import { GameState } from "./GameState.js";
import { COLLISION_GROUPS, SOL_PHYSICS_SETTINGS } from "../config/SolConstants.js";

await RAPIER.init();

export class Physics {
    /**@param {GameState} gameState */
    constructor(gameState) {
        this.gameState = gameState;

        this.world = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);
    }
    step(dt) {
        this.world.step();
    }
    async makeWorld(name) {
        let worldData;
        try {
            const ljson = await import("@solblade/common/utils/LoadJson.js");
            ljson.loadJson(`../worlds/${name}.json`)
        } catch {
            const worldModule = await import(`../worlds/${name}.json`);
            worldData = worldModule.default;
        }
        if (!worldData) return;
        console.log(worldData);
        const { vertices, indices } = colliderFromJson(worldData);
        const desc = RAPIER.ColliderDesc.trimesh(vertices, indices);
        desc.setCollisionGroups(COLLISION_GROUPS.ENEMY << 16 | COLLISION_GROUPS.WORLD);

        this.world.createCollider(desc)
    }

}
function colliderFromJson(data) {
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

        return { vertices, indices };
    }
}