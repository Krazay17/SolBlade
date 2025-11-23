import World from "../scenes/Scene";

export default class Manager {
    scene: World;
    constructor(scene: World) {
        this.scene = scene;
    }
}