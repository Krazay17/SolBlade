import Scene from "./Scene";

export default class Scene2 extends Scene {
    constructor(game) {
        super(game, 'scene2', { killFloor: -15 });
    }
    get spawnPos() { return this.getRespawnPoint() }
    onEnter(callback) {
        super.onEnter(callback)
        this.questManager.addQuest('crown');
    }
    onExit() {
        super.onExit();
        this.questManager.remove('crown');
    }
}