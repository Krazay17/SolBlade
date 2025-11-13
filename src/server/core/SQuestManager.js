import SCrownQuest from "./SCrownQuest.js";

export default class SQuestManager {
    constructor(game, io) {
        this.game = game;
        this.io = io;
        this.quests = [];
    }
    update(dt) {
        for (const q of this.quests) q.update?.(dt)
    }
    startCrownQuest() {
        this.quests.push(new SCrownQuest(this.game, this.io));
    }
    getQuest(name) {
        return this.quests.find(q=>q.name === name);
    }
}