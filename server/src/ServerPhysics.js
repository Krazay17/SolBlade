import RAPIER from '@dimforge/rapier3d';
import { GRAVITY_DEF } from '../../shared/ActorDefaults.js';
import world3Data from '../worlds/world3.json' assert {type: 'json'};
import { Server } from "socket.io";
import ActorManager from './ActorManager.js';

await RAPIER.init();

export default class ServerPhysics {
    constructor(io, actorManager) {
        /**@type {Server} */
        this.io = io;
        /**@type {ActorManager} */
        this.actorManager = actorManager

        this.world3 = this.makeWorld(world3Data);

        this.lastTime = Date.now();
        const timestep = 1 / 60;

        setInterval(() => {
            const now = Date.now();
            let dt = (now - lastTime) / 1000;
            this.lastTime = now;

            // You can step multiple times if dt > timestep
            while (dt > 0) {
                this.world3.step(timestep);
                dt -= timestep;
            }

            this.updateWorld3();
        }, 1000 / 60);

    }
    loop() {
        this.updateWorld3()
    }
    makeWorld(worldData) {
        const world = new RAPIER.World(GRAVITY_DEF);
        for (const obj of worldData) {
            const verts = new Float32Array(obj.vertices)
            const indic = new Float32Array(obj.indices)
            //const desc = RAPIER.ColliderDesc.convexMesh(verts, indic)
            const desc = RAPIER.ColliderDesc.trimesh(verts, indic);
            world.createCollider(desc);
        }
        return world;
    }
    updateWorld3() {
        this.world3.step();
        const playersOfWorld3 = this.actorManager.playerActors.filter(a => a.solWorld === 'world3');
    }
}