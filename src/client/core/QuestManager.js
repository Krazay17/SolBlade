import Player from "../player/Player";
import Game from "../CGame";
import MyEventEmitter from "./MyEventEmitter";
import QuestCrown from "./QuestCrown";
import QuestPlayerKill from "./QuestPlayerKill";

const questRegister = {
    crown: QuestCrown,
    playerKill: QuestPlayerKill,
}

export default class QuestManager {
    constructor(game, player) {
        /**@type {Game} */
        this.game = game;
        /**@type {Player} */
        this.player = player;

        this.ui = document.createElement('div');
        this.ui.id = 'questUI';
        document.body.appendChild(this.ui);

        this.notificationUI = document.createElement('div');
        this.notificationUI.id = 'quest-notificationUI';
        document.body.appendChild(this.notificationUI);

        this.quests = [];
    }
    remove(quest) {
        quest = typeof quest === 'string' ? this.hasQuest(quest) : quest;
        if (quest) {
            quest.onExit();
            const index = this.quests.indexOf(quest);
            this.quests.splice(index, 1);
        }
    }
    hasQuest(name) {
        return this.quests.find(q => q.name === name);
    }
    update(dt, time) {
        for (const quest of this.quests) {
            quest.update(dt, time);
        }
    }
    addQuest(quest) {
        const newQuest = typeof quest === 'string' ? new questRegister[quest](this.game, this) : quest;
        if (!newQuest) return;
        newQuest.onEnter?.();
        this.quests.push(newQuest);
        return newQuest;
    }
}