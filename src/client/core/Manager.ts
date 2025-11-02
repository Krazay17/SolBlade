import World from "../scenes/World";

export default class Manager {
    scene: World;
    constructor(scene: World) {
        this.scene = scene;
    }
}