import MyEventEmitter from "./MyEventEmitter";
import { netSocket } from "./NetManager";

export default class GameMode {
    constructor(name) {
        this.name = name;
        this.players = {};
        this.gamemodeUI = null;
        this.playerScore = 0;
        this.winningScore = 100;
        this.gameOn = false;

        MyEventEmitter.on('joinGame', player => {
            this.players[player.netId] = { data: { name: player.name }, score: 0 }
        })
        MyEventEmitter.on('currentPlayers', playerList => {
            for (const player of playerList) {
                this.players[player.netId] = { data: player.data, score: 0 };
            }
        })
        MyEventEmitter.on('newPlayer', ({ netId, data }) => {
            this.players[netId] = { data, score: 0 };
        });
        MyEventEmitter.on('dcPlayer', (netId) => {
            this.removePlayer(this.players[netId]);
            delete this.players[netId];
        })
        MyEventEmitter.on('playerNameUpdate', ({ netId, player, name }) => {
            const playerName = this.players[netId];
            playerName.data.name = name;
            playerName.element.innerText = `${playerName.data.name}: ${playerName.score}`;
        })
        MyEventEmitter.on('pickupCrown', () => {
            this.startGame();
        })
        MyEventEmitter.on('crownScoreIncrease', ({ playerId, score }) => {
            this.changeScore(playerId, score);
        })
        MyEventEmitter.on('gameStart', () => {
            this.startGame();
        })
        MyEventEmitter.on('gameEnd', (winner) => {
            this.endGame(winner);
        })
    }

    startGame() {
        if (this.gameOn) return;
        this.gameOn = true;
        if (!this.gamemodeUI) this.gamemodeUI = this.createGamemodeUI();
        else this.gamemodeUI.style.display = 'flex';
        for (const player of Object.values(this.players)) {
            if (!player.element) {
                player.element = this.addPlayer(player);
            }
        };
    }
    createGamemodeUI() {
        const ui = document.createElement('div');
        ui.id = 'gamemode-ui';
        document.body.appendChild(ui);
        return ui;
    }

    addPlayer(player) {
        const element = document.createElement('div');
        element.classList.add('gamemode-player');
        element.innerText = `${player.data.name}: ${player.score}`;
        this.gamemodeUI.appendChild(element);
        return element;
    }

    removePlayer(player) {
        if (player.element) {
            this.gamemodeUI.removeChild(player.element);
            player.element = null;
        }
    }

    changeScore(id, score) {
        const player = this.players[id];
        if (!player) return;
        this.players[id].score = score;
        if (!player.element) {
            player.element = this.addPlayer(player);
        }
        player.element.innerText = `${player.data.name}: ${score}`;
    }

    endGame(winner) {
        this.gameOn = false;
        if (this.gamemodeUI) {
            this.gamemodeUI.style.display = 'none';
        }
        for (const player of Object.values(this.players)) {
            if (!player || !player.element) return;
            player.element.innerText = `${player.data.name}: 0`;
        }
        if (winner) {
            const winnerName = this.players[winner].data.name;
            const winnerUi = document.createElement('div');
            winnerUi.classList.add('gamemode-winner');
            winnerUi.innerText = 'Winner: ' + winnerName + '!';
            document.body.appendChild(winnerUi);
            setTimeout(() => {
                winnerUi.remove();
            }, 15000);
        };
    }
}