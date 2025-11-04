import Scene from "./Scene";

export default class Scene4 extends Scene {
    constructor(game) {
        super(game, 'scene4')
    }
    get spawnPos() { return this.getRespawnPoint() };
}