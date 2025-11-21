import RAPIER from "@dimforge/rapier3d-compat";
import { SOL_PHYSICS_SETTINGS } from "./SolConstants.js";

await RAPIER.init();

export default class GameCore {
    constructor() {
        this.running = true;

        this.physicsWorld = new RAPIER.World(SOL_PHYSICS_SETTINGS.gravity);

        this.init();
    }
    init() {
        this.lastTime = performance.now();
        this.accumulator = 0;
        const timestep = 1 / 60;

        this.fixedUpdateTimer = setInterval(() => {
            const now = performance.now();
            const frameTime = Math.min((now - this.lastTime) / 1000, 0.25);
            this.lastTime = now;

            if (this.running) {
                this.accumulator += frameTime;
                while (this.accumulator >= timestep) {
                    this.fixedStep(timestep);

                    this.accumulator -= timestep;
                }
            }
        }, SOL_PHYSICS_SETTINGS.serverTick);
    }
    fixedStep(dt) { }
    addPlayer(data) { }
}