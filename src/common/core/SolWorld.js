import RAPIER from "@dimforge/rapier3d-compat";
import { COLLISION_GROUPS, SOL_PHYSICS_SETTINGS } from "../config/SolConstants.js";
import ActorManager from "./ActorManager.js";
import { GameLogic } from "./GameLogic.js";

export default class SolWorld {
    /**
     * @param {String} name 
     */
    constructor(name = "world1") {
        this.name = name;

        this.actorManager = null;

        this.ready = true;
        this.allGeoms = [];
        this.physics = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);
        this.physics.timestep = SOL_PHYSICS_SETTINGS.timeStep;

        this.onStep = null;
    }
    async enter() {
        await this.loadWorldData();

        this.ready = true;
    }
    async loadWorldData() {
        let file = null;
        try {
            const path = await import('path');

            file = path.resolve(`/common/worlds/${this.name}.json`);
        }
        catch (error) {
            console.warn('Cannot retrieve', this.name, error);
            file = `/common/worlds/${this.name}.json`;
        }
        if (!file) return;
        this.colliderFromJson(file, this.physics);
    }
    colliderFromJson(data, phys) {
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

            const verts = new Float32Array(filteredVerts.flat());

            // Flatten indices
            const indic = new Uint32Array(obj.indices.flat());
            const maxIndex = Math.max(...indic);
            if (maxIndex >= verts.length / 3) {
                console.warn("Skipping object with indices out of bounds:", obj.name);
                continue;
            }

            try {
                // Use trimesh for concave meshes
                const desc = RAPIER.ColliderDesc.trimesh(verts, indic);
                phys.createCollider(desc
                    .setCollisionGroups(COLLISION_GROUPS.ENEMY << 16 | COLLISION_GROUPS.WORLD)
                )
            } catch (e) {
                console.error("Failed to create collider for object:", obj.name, e);
            }
        }
    }
    exit() {
        // remove actors
        if (this.actorManager) {
            for (const a of this.actorManager.allActors) {
                a.removeBody(this.physics);
            }
        }
        // free physics
        this.physics.free();
    }
    step(dt) {
        if (!this.ready) return;
        this.physics?.step();
    }
    tick(dt) {
        if (this.actorManager) this.actorManager.tick(dt);
    }
}