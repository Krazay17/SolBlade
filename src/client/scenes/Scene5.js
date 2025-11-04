import Scene from "./Scene";

export default class Scene5 extends Scene {
    constructor(game) {
        super(game, 'scene5');
    }
    get spawnPos() { return this.getRespawnPoint() }
}