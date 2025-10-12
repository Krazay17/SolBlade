import Player from "../player/Player";
import GameScene from "../scenes/GameScene";

export default class Quest {
    constructor(scene, player, box) {
        /**@type {GameScene} */
        this.scene = scene;
        /**@type {Player} */
        this.player = player;
        this.box = box;

        this.ui = document.createElement('div');
        this.ui.classList.add('quest');
        this.box.appendChild(this.ui);
        this.ui.textContent = 'TEST QUESTTEST QUESTQUESTTEST QUESTTEST QUESTTEST QUEST';
    }
    update(dt, time) { }
}