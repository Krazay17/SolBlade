import SCrownQuest from "./SCrownQuest";

export default class SQuestManager {
    constructor(game, io) {
        this.game = game;
        this.io = io;

        this.quests = [];


    }
    update(dt) {

    }

    startCrownQuest() {
        this.quests.push(new SCrownQuest(this.game, this.io));
    }
}