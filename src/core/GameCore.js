import RAPIER from "@dimforge/rapier3d-compat";
import { SOL_PHYSICS_SETTINGS } from "./SolConstants.js";
import SolWorld from "./SolWorld.js";

await RAPIER.init();

export default class GameCore {
    constructor() {
        this.running = false;
        // this.solWorlds = [
        //     new SolWorld(this, "world1"),
        //     new SolWorld(this, "world2")
        // ];

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