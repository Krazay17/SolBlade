import World from "./World";

export default class World2 extends World {
    constructor(game) {
        super(game, 'world2', { killFloor: -30 });
    }
    get spawnPos() { return this.getRespawnPoint() }
    update(dt, time) {
        super.update(dt, time);
        if (this.player.isDead) return;
        const dist = this.player.position.distanceToSquared({ x: 0, y: 0, z: 0 })
        if (dist < 60 ** 2) {
            if (!this.questManager.hasQuest('crown')) this.questManager.addQuest('crown')
        } else {
            if (this.questManager.hasQuest('crown')) this.questManager.removeQuest('crown');
        }
    }
}