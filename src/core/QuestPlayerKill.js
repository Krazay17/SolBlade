import Quest from "./Quest";

export default class QuestPlayerKill extends Quest {
    onEnter() {
        this.killCount = 0;
        this.questTitle = 'Kill players'
        this.text = '0/10';
    }
    updateQuest(data) {
        if (data.dealer === this.player) {
            this.killCount++;
            this.text = `${this.killCount}/10`;
            this.setNotification(`${data.target.name} slain! ${this.killCount}/10`);
        }
    }
}