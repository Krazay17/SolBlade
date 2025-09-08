import { netSocket } from "./NetManager";

export default class GameMode {
    constructor(name) {
        this.name = name;
        this.players = [];
        this.gamemodeUI = null;
        this.playerScore = 0;
        this.winningScore = 100;
    }
    startGame() {
        if (!this.gamemodeUI) this.gamemodeUI = this.createGamemodeUI();
    }
    createGamemodeUI() {
        const ui = document.createElement('div');
        ui.id = 'gamemode-ui';
        document.body.appendChild(ui);
        return ui;
    }
}