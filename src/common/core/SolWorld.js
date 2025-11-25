import RAPIER from "@dimforge/rapier3d-compat";
import { SOL_PHYSICS_SETTINGS } from "../config/SolConstants.js";
import ActorManager from "../managers/ActorManager.js";

export default class SolWorld {
    constructor(name = "world1") {
        this.name = name;
        this.ready = true;

        this.physics = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);
        this.physics.timestep = SOL_PHYSICS_SETTINGS.timeStep;

        /**@type {ActorManager} */
        this.actorManager = null;
    }
    init(actorRegistry, client = false) {
        this.actorManager = new ActorManager(this, actorRegistry, client);
    }
    enter(callback) {
        const enemies = 2;
        for (let i = 0; i < enemies; i++) {
            this.actorManager.addActor('enemy', { subtype: "wizard", pos: [0, 20, i] });
        }
    }
    exit() {
        // remove actors
        for (const a of this.actorManager.allActors) {
            a.removeBody();
        }
        // free physics
        this.physics.free();
    }
    step(dt) {
        if (!this.ready) return;
        this.physics?.step();
    }
    tick(dt) { }
}