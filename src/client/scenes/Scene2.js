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
    // update(dt, time) {
    //     super.update(dt, time);
    //     if (this.player.isDead) return;
    //     const dist = this.player.position.distanceToSquared({ x: 0, y: 0, z: 0 })
    //     if (dist < 60 ** 2) {
    //         if (!this.questManager.hasQuest('crown')) this.questManager.addQuest('crown')
    //     } else {
    //         if (this.questManager.hasQuest('crown')) this.questManager.remove('crown');
    //     }
    // }
}