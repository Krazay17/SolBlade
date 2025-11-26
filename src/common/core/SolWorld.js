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

    }
    async enter(callback) {
        await this.loadWorldData();

        //test enemy spawn before I use glb locations
        const enemies = 2;
        for (let i = 0; i < enemies; i++) {
            this.actorManager.newActor('enemy', { subtype: "wizard", pos: [0, 20, i] });
        }
        this.ready = true;
        if (callback) callback();
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
    }
    tick(dt) {
        this.actorManager.tick(dt);
    }
}