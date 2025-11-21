import SolWorld from "../SolWorld.js";

import { loadJson } from "./utils/LoadJson.js";

export default class SSolWorld extends SolWorld {
    constructor(game, name) {
        super(game, name);
    }
    async enter(callback) {
        const sceneGeom = await loadJson(`../geoms/${this.name}.json`);

        if (callback) callback();
    }
}