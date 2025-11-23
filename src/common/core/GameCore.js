import RAPIER from "@dimforge/rapier3d-compat";
import { SOL_PHYSICS_SETTINGS } from "../config/SolConstants.js";
import SolWorld from "./SolWorld.js";

await RAPIER.init();

export default class GameCore {
    constructor(net) {
        this.net = net;
        this.running = true;
        // this.solWorlds = [
        //     new SolWorld(this, "world1"),
        //     new SolWorld(this, "world2")
        // ];
        this.solWorlds = {
            world1: new SolWorld(this, 'world1'),
            world2: new SolWorld(this, 'world2')
        }
        this.solWorlds.world1.enter()
        this.solWorlds.world2.enter()
        this.init();
    }
    init() {
        this.fixedUpdateTimer = setInterval(() => {
            if (this.running) {
                this.fixedStep();
            }
        }, SOL_PHYSICS_SETTINGS.serverTick * 1000);
    }
    fixedStep(dt) {
        this.solWorlds.world1.tick(dt);
        this.solWorlds.world1.fixedStep(dt);
        this.solWorlds.world2.tick(dt);
        this.solWorlds.world2.fixedStep(dt);
    }
    addPlayer() { }
    updateActors() {

    }
}