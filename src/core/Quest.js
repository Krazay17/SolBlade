import QuestManager from "./QuestManager";

export default class Quest {
    constructor(manager, data = {
        title: 'default',
        name: 'default',
    }) {
        /**@type {QuestManager} */
        this.manager = manager;
        this.title = data.title;
        this.name = data.name;
        this.data = data;

        this.ui = document.createElement('div');
        this.ui.classList.add('quest');
        this.manager.ui.appendChild(this.ui);
    }
    onEnter() { }
    set text(value) {
        this.ui.textContent = `${this.data.title}: ${value}`;
    }
    onExit() { this.ui.remove() }
    updateQuest(data) {
        const { text } = data;
        this.ui.textContent = `${this.data.title}: ${text}`;
    }
    setNotification(text, color = 'quest-blue') {
        const bigText = document.createElement('div');
        bigText.textContent = text;
        bigText.classList.add('quest-notification', color);
        this.manager.notificationUI.appendChild(bigText);
        bigText.addEventListener('animationend', () => bigText.remove());
    }
    update(dt, time) { }
    get player() {
        return this.manager.player;
    }
} 