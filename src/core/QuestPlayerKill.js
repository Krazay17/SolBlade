import Quest from "./Quest";

export default class QuestPlayerKill extends Quest {
    constructor(game, manager) {
        super(game, manager, {
            title: 'Kill players',
            name: 'playerKill',
        })
    }
    onEnter() {
        this.killCount = 0;
        this.requirement = 10;
        this.questTitle = 'Kill players'
        this.text = `0/${this.requirement}`;
        this.bindEvent('playerDied', this.updateQuest);
    }
    onExit() {
        this.unbindEvent('playerDied');
        super.onExit();
    }
    completeQuest() {
        this.manager.remove(this);
        this.setNotification('Kill players complete!');
        this.game.inventory.addCards(5);
        this.manager.addQuest('playerKill');
    }
    updateQuest(data) {
        if (data.dealer === this.player) {
            this.killCount++;
            this.text = `${this.killCount}/${this.requirement}`;
            this.setNotification(`${data.target.name} slain! ${this.killCount}/${this.requirement}`);
        }
        if(this.killCount >= this.requirement) {
            this.completeQuest();
        }
    }
}