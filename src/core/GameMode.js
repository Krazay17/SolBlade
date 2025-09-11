import MyEventEmitter from "./MyEventEmitter";
import { netSocket } from "./NetManager";

export default class GameMode {
    constructor(scene, name, actor) {
        this.scene = scene;
        this.name = name;
        this.actor = actor;
        this.hasCrown = false;
        this.players = {};
        this.gamemodeUI = null;
        this.gameOn = false;

        MyEventEmitter.on('joinGame', () => {
            this.hasCrown = false;
            this.actor.dropCrown();
        });
        MyEventEmitter.on('disconnect', () => {
            this.hasCrown = false;
            this.actor.dropCrown();
            this.gameOn = false;
            for (const player of Object.values(this.players)) {
                this.removePlayer(player);
            }
            this.players = {};
        });
        MyEventEmitter.on('currentPlayers', playerList => {
            for (const player of playerList) {
                this.players[player.netId] = { data: player.data, score: player.score || 0, element: null };
            }
        });
        MyEventEmitter.on('newPlayer', ({ netId, data }) => {
            this.players[netId] = { data, score: 0, element: null };
        });
        MyEventEmitter.on('dcPlayer', (netId) => {
            this.removePlayer(this.players[netId]);
            delete this.players[netId];
        });
        MyEventEmitter.on('playerNameUpdate', ({ netId, name }) => {
            const player = this.players[netId];
            if (!player) return;
            player.data.name = name;
            if (!player.element) return;
            player.element.innerText = `${player.data.name}: ${player.score}`;
        });
        MyEventEmitter.on('pickupCrown', () => {
            this.hasCrown = true;
            this.actor.pickupCrown();
            this.startGame();
        });
        MyEventEmitter.on('playerDied', ({ player, source }) => {
            if (!this.hasCrown) return;
            this.hasCrown = false;
            let pos;
            switch (source) {
                case 'the void':
                    pos = { x: 0, y: 0, z: 0 };
                    break;
                default:
                    pos = this.actor.position;
            }
            pos.y += 1;
            this.actor.dropCrown();
            netSocket.emit('dropCrown', pos);
        });
        MyEventEmitter.on('dropCrown', () => {
        });
        MyEventEmitter.on('crownScoreIncrease', ({ playerId, score }) => {
            this.changeScore(playerId, score);
        });
        MyEventEmitter.on('crownGameStarted', (players) => {
            this.startGame();
            if (!players) return;
            for (const player of players) {
                this.changeScore(player.id, player.score || 0);
            }
        });
        MyEventEmitter.on('crownGameEnded', (winner) => {
            this.actor.dropCrown();
            this.hasCrown = false;
            this.endGame(winner);
        });
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