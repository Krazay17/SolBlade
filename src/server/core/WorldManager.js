import SolWorld from "@solblade/common/core/SolWorld.js";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export default class WorldManager {
    constructor(game) {
        this.game = game;
        this.loader = new GLTFLoader();

        /**@type {Record<String, SolWorld>} */
        this.worlds = {
            world1: new SolWorld('world1', this.loader),
            world2: new SolWorld('world2', this.loader),
        }
        for (const world of Object.values(this.worlds)) {
            world.enter();
        }
    }
    step(dt) {
        for (const world of Object.values(this.worlds)) {
            world.step(dt);
            world.tick(dt);
        }
    }
}