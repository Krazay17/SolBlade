import RAPIER from "@dimforge/rapier3d-compat";
import { COLLISION_GROUPS, SOL_PHYSICS_SETTINGS } from "../config/SolConstants.js";
import ActorManager from "./ActorManager.js";

export default class SolWorld {
    /**
     * 
     * @param {String} name 
     */
    constructor(name = "world1") {
        this.name = name;

        this.ready = true;
        this.allGeoms = [];
        this.physics = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);
        this.physics.timestep = SOL_PHYSICS_SETTINGS.timeStep;

        this.onStep = null;
        this.init();
    }
    init(){
        this.actorManager = new ActorManager(this);
    }
    async enter() {
        await this.loadWorldData();

        //test enemy spawn before I use glb locations
        const enemies = 1;
        for (let i = 0; i < enemies; i++) {
            this.actorManager.newActor('enemy', { subtype: "wizard", pos: [0, 20, i] });
        }
        this.ready = true;
    }
    async loadWorldData() {
        try {
            const path = await import('path');

            const file = path.resolve(`/common/worlds/${this.name}.json`);
            this.colliderFromJson(file, this.physics);
        }
        catch (error) {
            console.warn('Cannot retrieve', this.name, error);
            return null;
        }
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
        for (const a of this.actorManager.allActors) {
            a.removeBody(this.physics);
        }
        // free physics
        this.physics.free();
    }
    step(dt) {
        if (!this.ready) return;
        this.physics?.step();

        this.timeSinceLastUpdate = (this.timeSinceLastUpdate || 0) + dt;
        if (this.timeSinceLastUpdate >= 0.1) {
            this.timeSinceLastUpdate = 0;

            const actorArray = arrayBuffer(filterMoved(this.actorManager.allActors))
            if (this.onStep) this.onStep(actorArray.buffer);
        }
    }
    tick(dt) {
        this.actorManager.tick(dt);
    }
}

function arrayBuffer(list, length = 8) {
    const count = list.length;
    const buffer = new Float32Array(count * length)
    let i = 0;
    for (const e of list) {
        buffer[i++] = e.id ?? 0;
        buffer[i++] = e.pos[0] ?? 0;
        buffer[i++] = e.pos[1] ?? 0;
        buffer[i++] = e.pos[2] ?? 0;
        buffer[i++] = e.rot[0] ?? 0;
        buffer[i++] = e.rot[1] ?? 0;
        buffer[i++] = e.rot[2] ?? 0;
        buffer[i++] = e.rot[3] ?? 0;
    };
    return buffer;
}

function filterMoved(actors) {
    return actors.filter(a => {
        if (!a.active) return false;
        const moved = (
            !a.lastPos ||
            a.pos[0] !== a.lastPos[0] ||
            a.pos[1] !== a.lastPos[1] ||
            a.pos[2] !== a.lastPos[2]
        );
        const rotated = (
            !a.lastRot ||
            a.rot[0] !== a.lastRot[0] ||
            a.rot[1] !== a.lastRot[1] ||
            a.rot[2] !== a.lastRot[2] ||
            a.rot[3] !== a.lastRot[3]
        );
        if (moved || rotated) {
            a.lastPos = [a.pos[0], a.pos[1], a.pos[2]];
            a.lastRot = [a.rot[0], a.rot[1], a.rot[2], a.rot[3]];
            return true;
        }
        return false;
    })
}