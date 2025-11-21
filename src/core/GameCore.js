import { SOL_PHYSICS_SETTINGS } from "./SolConstants.js";
import SolWorld from "./SolWorld.js";

export default class GameCore {
    constructor() {
        this.solWorld = new SolWorld(this);

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

            this.accumulator += frameTime;
            while (this.accumulator >= timestep) {
                this.tick(timestep);
                this.accumulator -= timestep;
            }
        }, SOL_PHYSICS_SETTINGS.serverTick);
    }
    tick(dt) {
        this.solWorld.step(dt);
    }
    addPlayer(data) {

    }
}