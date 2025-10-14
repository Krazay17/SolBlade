import Player from "../player/Player";
import GameScene from "../scenes/GameScene";
import MyEventEmitter from "./MyEventEmitter";
import QuestCrown from "./QuestCrown";
import QuestPlayerKill from "./QuestPlayerKill";

const questRegister = {
    crown: QuestCrown,
    playerKill: QuestPlayerKill,
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

        this.notificationUI = document.createElement('div');
        this.notificationUI.id = 'quest-notificationUI';
        document.body.appendChild(this.notificationUI);

        this.quests = [];

        MyEventEmitter.on('questEvent', data => {
            const quest = this.quests.filter(q => q.questId === data.questId);
            if (quest) {
                for (const q of quest) {
                    q.updateQuest(data);
                }
            }
        })
    }
    removeQuest(questId) {
        const quest = this.hasQuest(questId);
        if (quest) {
            quest.onExit();
            const index = this.quests.indexOf(quest);
            this.quests.splice(index, 1);
        }
    }
    hasQuest(questId) {
        return this.quests.find(q => q.questId === questId);
    }
    update(dt, time) {
        for (const quest of this.quests) {
            quest.update(dt, time);
        }
    }
    addQuest(quest) {
        const newQuest = new questRegister[quest](this.scene, this.player, this.ui, this.notificationUI, quest);
        if (!newQuest) return;
        newQuest.onEnter?.();
        this.quests.push(newQuest);
        return newQuest;
    }
}