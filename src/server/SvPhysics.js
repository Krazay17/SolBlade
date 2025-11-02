import RAPIER from '@dimforge/rapier3d-compat';
import { Server } from "socket.io";
import ActorManager from './SvActorManager.js';
import { loadJson } from './LoadJson.js';

const world1Data = await loadJson('./worlds/world1.json');
const world2Data = await loadJson('./worlds/world2.json');
const world3Data = await loadJson('./worlds/world3.json');
const world4Data = await loadJson('./worlds/world4.json');
await RAPIER.init({});

export default class SvPhysics {
    constructor(io, actorManager) {
        /**@type {Server} */
        this.io = io;
        /**@type {ActorManager} */
        this.actorManager = actorManager;

        this.world0 = new RAPIER.World({ x: 0, y: -9, z: 0 });
        this.world1 = this.makeWorld(world1Data);
        this.world2 = this.makeWorld(world2Data);
        this.world3 = this.makeWorld(world3Data);
        this.world4 = this.makeWorld(world4Data);

        this.lastTime = Date.now();
        this.accumulator = 0;
        const timestep = 1 / 60;

        setInterval(() => {
            const now = Date.now();
            const frameTime = (now - this.lastTime) / 1000;
            this.lastTime = now;

            this.accumulator += frameTime;
            while (this.accumulator >= timestep) {
                this.loop(timestep);
                this.accumulator -= timestep;
            }
        }, 1000 / 60);


    }
    loop(dt) {
        this.updateWorld(dt, 'world1')
        this.updateWorld(dt, 'world2')
        this.updateWorld(dt, 'world3')
        this.updateWorld(dt, 'world4')
    }
    makeWorld(worldData) {
        const world = new RAPIER.World({ x: 0, y: -9, z: 0 });

        for (const obj of worldData) {
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
                world.createCollider(desc);
            } catch (e) {
                console.error("Failed to create collider for object:", obj.name, e);
            }
        }

        return world;
    }
    updateWorld(dt, world) {
        if (!this[world]) return;
        this[world].step();
        const { players, enemies, others } = this.actorManager.actorsOfWorld[world];

        const enemyPositions = enemies.flatMap(e =>
            e.active ? [{ id: e.data.netId, pos: e.body.translation(), rot: e.rotation }] : []
        );


        this.timeSinceLastUpdate = (this.timeSinceLastUpdate || 0) + dt;
        if (this.timeSinceLastUpdate >= 0.01) {
            this.timeSinceLastUpdate = 0;
            for (const p of players) {
                this.io.to(p.netId).emit('updateEnemies', enemyPositions);
            }
        }

    }
}