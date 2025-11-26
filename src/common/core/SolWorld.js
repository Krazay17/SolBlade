import RAPIER from "@dimforge/rapier3d-compat";
import { SOL_PHYSICS_SETTINGS } from "../config/SolConstants.js";
import ActorManager from "./ActorManager.js";
import { getVerts } from "../utils/VertUtils.js";
import { Mesh } from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { serverActors } from "./Registry.js";

export default class SolWorld {
    /**
     * 
     * @param {String} name 
     * @param {GLTFLoader} loader 
     */
    constructor(name = "world1", loader, actorRegistry = serverActors) {
        this.name = name;
        this.glbLoader = loader;
        this.actorManager = new ActorManager(this, actorRegistry);

        this.ready = true;
        this.worldCollider = null;
        this.allGeoms = [];

        this.physics = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);
        this.physics.timestep = SOL_PHYSICS_SETTINGS.timeStep;

        this.onStep = null;

    }
    async enter() {
        await this.loadWorldData();

        //test enemy spawn before I use glb locations
        // const enemies = 1;
        // for (let i = 0; i < enemies; i++) {
        //     this.actorManager.newActor('enemy', { subtype: "wizard", pos: [0, 20, i] });
        // }
        this.ready = true;
    }
    async loadWorldData() {
        //make physics from glb file
        const data = await this.glbLoader.loadAsync(`/assets/${this.name}.glb`);
        data.scene.traverse((child) => {
            if (child instanceof Mesh) {
                this.allGeoms.push(child.geometry.clone());
                const { vertices, indices } = getVerts(child.geometry);
                const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
                colliderDesc.setFriction(0);
                colliderDesc.setRestitution(0);
                this.physics.createCollider(colliderDesc);
            }
        });
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
        console.log(this.actorManager.allActors[1])

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