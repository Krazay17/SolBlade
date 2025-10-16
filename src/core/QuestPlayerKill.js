import MyEventEmitter from "./MyEventEmitter";
import Quest from "./Quest";

export default class QuestPlayerKill extends Quest {
    constructor(manager) {
        super(manager, {
            title: 'Kill players',
            name: 'playerKill',
        })
    }
    onEnter() {
        this.killCount = 0;
        this.questTitle = 'Kill players'
        this.text = '0/10';
        MyEventEmitter.on('playerDied', this.updateQuest.bind(this));
    }
    onExit() {
        MyEventEmitter.off('playerDied', this.updateQuest.bind(this));
    }
    updateQuest(data) {
        if (data.dealer === this.player) {
            this.killCount++;
            this.text = `${this.killCount}/10`;
            this.setNotification(`${data.target.name} slain! ${this.killCount}/10`);
        }
    }
}