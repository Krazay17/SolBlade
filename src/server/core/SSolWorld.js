import SolWorld from "@solblade/common/core/SolWorld.js"

import { loadJson } from "@solblade/common/utils/LoadJson.js"

export default class SSolWorld extends SolWorld {
    constructor(name = "world1") {
        super(name);
    }
    async enter(callback) {
        const sceneGeom = await loadJson(`../common/worlds/${this.name}.json`);

        if (callback) callback();
    }
}