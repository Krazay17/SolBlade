import { SSolWorld } from "@solblade/server/core/SSolWorld.js";

export default class WorldManager {
    constructor(game) {
        this.game = game;

        /**@type {Record<String, SSolWorld>} */
        this.worlds = {
            world1: new SSolWorld(this.game, "world1"),
            world2: new SSolWorld(this.game, "world2"),
        }

    }
    async start() {
        for (const world of Object.values(this.worlds)) {
            await world.enter();
        }
    }
    step(dt) {
        for (const world of Object.values(this.worlds)) {
            world.step(dt);
            world.tick(dt);
        }
    }
}