import RAPIER from '@dimforge/rapier3d-compat';
import { loadJson } from './LoadJson.js';
import SGame from '../SGame.js';

const scene1Data = await loadJson('../worlds/scene1.json');
const scene2Data = await loadJson('../worlds/scene2.json');
const scene3Data = await loadJson('../worlds/scene3.json');
const scene4Data = await loadJson('../worlds/scene4.json');
await RAPIER.init({});

export default class SPhysics {
    constructor(game, io) {
        /**@type {SGame} */
        this.game = game;
        this.io = io;

        this.scene0 = new RAPIER.World({ x: 0, y: -9, z: 0 });
        this.scene1 = this.makeWorld(scene1Data);
        this.scene2 = this.makeWorld(scene2Data);
        this.scene3 = this.makeWorld(scene3Data);
        this.scene4 = this.makeWorld(scene4Data);
    }
    update(dt) {
        this.updateWorld(dt, 'scene1')
        this.updateWorld(dt, 'scene2')
        this.updateWorld(dt, 'scene3')
        this.updateWorld(dt, 'scene4')
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
    updateWorld(dt, scene) {
        if (!this[scene]) return;
        this[scene].step();
        const { players, enemies, others } = this.game.actorManager.actorsOfScene[scene];

        const enemyPositions = enemies.flatMap(e =>
            e.active ? [{ id: e.data.id, pos: e.body.translation(), rot: e.rotation }] : []
        );


        this.timeSinceLastUpdate = (this.timeSinceLastUpdate || 0) + dt;
        if (this.timeSinceLastUpdate >= 0.01) {
            this.timeSinceLastUpdate = 0;
            for (const p of players) {
                this.io.to(p.id).emit('updateEnemies', enemyPositions);
            }
        }
    }
}