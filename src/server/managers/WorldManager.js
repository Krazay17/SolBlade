import SolWorld from "@common/core/SolWorld";

export default class WorldManager {
    constructor(game) {
        this.game = game;

        /**@type {Record<String, SolWorld>} */
        this.worlds = {
            world1: new SolWorld('world1'),
            world2: new SolWorld('world2'),
        }
    }
    step(dt) {
        for (const world of Object.values(this.worlds)) {
            world.step(dt);
        }
    }
}