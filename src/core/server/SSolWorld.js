import SolWorld from "../SolWorld.js";

import { loadJson } from "./utils/LoadJson.js";

export default class SSolWorld extends SolWorld {
    constructor(game, sceneName) {
        super(game, sceneName);
    }
    async makePhysics(sceneName) {
        const sceneGeom = await loadJson(`../geoms/${sceneName}.json`);

    }
}