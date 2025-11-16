import { Server } from "socket.io";
import SGame from "../SGame.js";

export default class SCrownQuest {
    constructor(game, io) {
        /**@type {SGame} */
        this.game = game;
        /**@type {Server} */
        this.io = io;

        this.name = "crown";
        this.players = {}
        this.started = false;
        this.winningScore = 100;
        this.defaultPos = { x: 0, y: 1, z: 0 };

        this.makeCrown();
    }
    join(socket) {
        console.log('join crown quest', socket.id)
        this.players[socket.id] = { score: 0, hasCrown: false };
        this.io.emit('crownGamePlayers', this.players);
        socket.on('crownGameLeave', () => {
            this.leave(socket);
        });
        socket.on('disconnect', () => {
            this.leave(socket);
        });
        socket.on('crownPickup', () => {
            this.pickupCrown(socket.id);
        });
        socket.on('dropCrown', (pos) => {
            this.dropCrown(socket.id, pos);
        });
    }
    leave(socket) {
        socket.removeAllListeners("crownGameLeave");
        socket.removeAllListeners("disconnect");
        socket.removeAllListeners("crownPickup");
        socket.removeAllListeners("dropCrown");

        this.dropCrown(socket.id, this.defaultPos)
        delete this.players[socket.id];
    }
    start() {
        if (this.started) return;
        this.started = true;
        for (const [id, p] of Object.entries(this.players)) {
            p.score = 0;
        }
        this.io.emit('crownGameStart');
        this.io.emit('crownGamePlayers', this.players);
    }
    endGame(id) {
        this.started = false;
        this.io.emit('crownGameEnd', id);
        this.dropCrown(id);
    }
    pickupCrown(id) {
        const player = this.players[id];
        if (!player) return;
        this.start();
        player.hasCrown = true;
        this.io.emit('crownPickup', id);
        clearInterval(this.crownPointsInterval);
        this.crownPointsInterval = setInterval(() => {
            player.score += 1;
            this.io.emit('crownScoreIncrease', { id, score: player.score });
            if (player.score >= this.winningScore) {
                clearInterval(this.crownPointsInterval);
                this.endGame(id);
            }
        }, 1000);
    }
    dropCrown(id, pos) {
        const player = this.players[id];
        if (player && player.hasCrown) {
            player.hasCrown = false;
            clearInterval(this.crownPointsInterval);
            this.io.emit('dropCrown', id);
            this.makeCrown(pos);
        }
    }
    makeCrown(pos) {
        pos = pos || this.defaultPos;
        this.crown = this.game.createActor('crown', { pos, sceneName: "scene2" });
        this.crown.quest = this;
    }
}