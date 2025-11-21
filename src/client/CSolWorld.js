import SolWorld from "../core/SolWorld";
import Scene from "./scenes/Scene";
import Scene2 from "./scenes/Scene2";

const sceneRegistry = {
    scene: Scene,
    scene2: Scene2,
}

export default class CSolWorld extends SolWorld {
    constructor(game, sceneName = "scene") {
        super(game, sceneName);

        this.scene = this.makeScene(sceneName)
    }
    async makeScene(sceneName) {
        const sceneClass = sceneRegistry[sceneName];
        if (!sceneClass) return;
        const scene = new sceneClass(this.game);
        await scene.init();
        return scene
    }
}