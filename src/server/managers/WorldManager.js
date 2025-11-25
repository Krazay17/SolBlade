import SolWorld from "@solblade/common/core/SolWorld.js";

export default class WorldManager {
    constructor(game) {
        this.game = game;

        /**@type {Record<String, SolWorld>} */
        this.worlds = {
            world1: new SolWorld('world1'),
            world2: new SolWorld('world2'),
        }
        this.init()
    }
    init() {
        for (const world of Object.values(this.worlds)) {
            world.init();
        }
    }
    step(dt) {
        for (const world of Object.values(this.worlds)) {
            world.step(dt);
        }
    }
}