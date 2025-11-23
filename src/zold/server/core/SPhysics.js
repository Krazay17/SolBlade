import RAPIER from '@dimforge/rapier3d-compat';
import { loadJson } from '../../../common/utils/LoadJson.js';
import SGame from '../SGame.js';
import { COLLISION_GROUPS } from '../../old/shared/index.js';

const scene1Data = await loadJson('../worlds/scene1.json');
const scene2Data = await loadJson('../worlds/scene2.json');
const scene3Data = await loadJson('../worlds/scene3.json');
const scene4Data = await loadJson('../worlds/scene4.json');
const scene5Data = await loadJson('../worlds/scene5.json');
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
        this.scene5 = this.makeWorld(scene5Data);
    }
    update(dt) {
        this.updateWorld(dt, 'scene1')
        this.updateWorld(dt, 'scene2')
        this.updateWorld(dt, 'scene3')
        this.updateWorld(dt, 'scene4')
        //this.updateWorld(dt, 'scene5')
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
                world.createCollider(desc
                    .setCollisionGroups(COLLISION_GROUPS.ENEMY << 16 | COLLISION_GROUPS.WORLD)
                    .setActiveCollisionTypes(0)
                )
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
        if (players.length < 1) return;

        const enemyBuffer = arrayBuffer(filterMoved(enemies), 8);
        const otherBuffer = arrayBuffer(filterMoved(others), 8);

        this.timeSinceLastUpdate = (this.timeSinceLastUpdate || 0) + dt;
        if (this.timeSinceLastUpdate >= 0.1) {
            this.timeSinceLastUpdate = 0;
            for (const p of players) {
                this.io.to(p.id).emit('worldUpdate', enemyBuffer.buffer, otherBuffer.buffer);
            }
        }
    }

}

function arrayBuffer(list, length = 8) {
    const count = list.length;
    const buffer = new Float32Array(count * length)
    let i = 0;
    for (const e of list) {
        buffer[i++] = e.id ?? 0;
        buffer[i++] = e.pos.x ?? 0;
        buffer[i++] = e.pos.y ?? 0;
        buffer[i++] = e.pos.z ?? 0;
        buffer[i++] = e.rot.x ?? 0;
        buffer[i++] = e.rot.y ?? 0;
        buffer[i++] = e.rot.z ?? 0;
        buffer[i++] = e.rot.w ?? 0;
    };
    return buffer;
}

function filterMoved(actors) {
    return actors.filter(a => {
        if (!a.active || !a.auth) return false;
        const moved = (
            !a.lastPos ||
            a.pos.x !== a.lastPos[0] ||
            a.pos.y !== a.lastPos[1] ||
            a.pos.z !== a.lastPos[2]
        );
        const rotated = (
            !a.lastRot ||
            a.rot.x !== a.lastRot[0] ||
            a.rot.y !== a.lastRot[1] ||
            a.rot.z !== a.lastRot[2] ||
            a.rot.w !== a.lastRot[3]
        );
        if (moved || rotated) {
            a.lastPos = [a.pos.x, a.pos.y, a.pos.z];
            a.lastRot = [a.rot.x, a.rot.y, a.rot.z, a.rot.w];
            return true;
        }
        return false;
    })
}