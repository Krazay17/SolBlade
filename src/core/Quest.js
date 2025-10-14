import Player from "../player/Player";
import GameScene from "../scenes/GameScene";

export default class Quest {
    constructor(scene, player, box, notificationUI, questId) {
        /**@type {GameScene} */
        this.scene = scene;
        /**@type {Player} */
        this.player = player;
        this.box = box;
        this.notificationUI = notificationUI;
        this.questId = questId;

        this.data;

        this.questTitle = '';

        this.ui = document.createElement('div');
        this.ui.classList.add('quest');
        this.box.appendChild(this.ui);

    }
    onEnter() { }
    set text(value) {
        this.ui.textContent = `${this.questTitle}: ${value}`;
    }
    onExit() { }
    updateQuest(data) {
        const { text } = data;
        this.ui.textContent = `${this.questTitle}: ${text}`;
    }
    setNotification(text, color = 'quest-blue') {
        const bigText = document.createElement('div');
        bigText.textContent = text;
        bigText.classList.add('quest-notification', color);
        this.notificationUI.appendChild(bigText);
        bigText.addEventListener('animationend', () => bigText.remove());
    }
    destroy() {
        this.ui.remove();
    }
    update(dt, time) { }
} 