import GameScene from "../scenes/GameScene";

export default class Manager {
    scene: GameScene;
    constructor(scene: GameScene) {
        this.scene = scene;
    }
}