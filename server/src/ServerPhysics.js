import RAPIER from '@dimforge/rapier3d-compat';
import { Server } from "socket.io";
import ActorManager from './ActorManager.js';
import { loadJson } from './LoadJson.js';

const world3Data = await loadJson('../worlds/world3.json');

await RAPIER.init({});

export default class ServerPhysics {
    constructor(io, actorManager) {
        /**@type {Server} */
        this.io = io;
        /**@type {ActorManager} */
        this.actorManager = actorManager

        this.world3 = this.makeWorld(world3Data);
        //console.log(world3Data[0]);

        this.lastTime = Date.now();
        const timestep = 1 / 60;

        setInterval(() => {
            const now = Date.now();
            let dt = (now - this.lastTime) / 1000;
            this.lastTime = now;

            // You can step multiple times if dt > timestep
            while (dt > 0) {
                dt -= timestep;
                this.loop(timestep);
            }
        }, 1000 / 60);

    }
    loop() {
        this.updateWorld3()
    }
    makeWorld(worldData) {
        const world = new RAPIER.World({x:0, y:-9, z:0});

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


    updateWorld3() {
        if(!this.world3)return;
        this.world3.step();
        const actorsOfWorld = this.actorManager.actorsByWorld['world3'] || [];
        const players = actorsOfWorld.filter(a => a.type === 'player');
        const enemies = this.actorManager.serverActors.filter(a => a.data.solWorld === 'world3');

        const enemyPositions = enemies.map(e => ({
            id: e.data.netId,
            pos: e.body.translation(),
            rot: e.body.rotation(),
        }))

        for (const p of players) {
            this.io.to(p.netId).emit('updateEnemies', enemyPositions);
        }
    }
}