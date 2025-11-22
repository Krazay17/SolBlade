import RAPIER from "@dimforge/rapier3d-compat";
import { SOL_PHYSICS_SETTINGS } from "./SolConstants.js";

await RAPIER.init();

export default class GameCore {
    constructor() {
        this.running = false;
        this.init();
    }
    init() {
        this.fixedUpdateTimer = setInterval(() => {
            if (this.running) {
                this.fixedStep();
            }
        }, SOL_PHYSICS_SETTINGS.serverTick * 1000);
    }
    fixedStep(dt) { }
    addPlayer(data) { }
}