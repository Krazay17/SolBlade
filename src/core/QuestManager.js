import Player from "../player/Player";
import GameScene from "../scenes/GameScene";
import Quest from "./Quest";

const questRegister = {
    quest1: Quest,
}

export default class QuestManager {
    constructor(scene, player) {
        /**@type {GameScene} */
        this.scene = scene
        /**@type {Player} */
        this.player = player;

        this.ui = document.createElement('div');
        this.ui.id = 'questUI';
        document.body.appendChild(this.ui);

        this.quests = [];
    }
    update(dt, time) {
        for (const quest of this.quests) {
            quest.update(dt, time);
        }
    }
    addQuest(quest) {
        const newQuest = new questRegister[quest](this.scene, this.player, this.ui);
        this.quests.push(newQuest);
    }
}