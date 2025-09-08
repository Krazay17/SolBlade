import { netSocket } from "./NetManager";

export default class GameMode {
    constructor(name) {
        this.name = name;
        this.players = [];
    }
    startGame() {
        this.gamemodeUI = document.createElement('div');
        this.gamemodeUI.id = 'gamemode-ui';
        document.body.appendChild(this.gamemodeUI);
    }
}