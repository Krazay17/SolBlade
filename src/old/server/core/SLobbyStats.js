import { Server } from "socket.io";
import SGame from "../SGame.js";

export default class SLobbyStats {
    constructor(game, io) {
        /**@type {SGame} */
        this.game = game;
        /**@type {Server} */
        this.io = io;
    }
    addDamage(id, amount) {
        const player = this.game.getActorById(id);
        player.totalDamage += amount;
        this.io.emit('lobbyStats', { id, damage: amount, totalDamage: player.totalDamage });
    }
    addKill(id) {
        const player = this.game.getActorById(id)
        player.kills += 1;
        this.io.emit('lobbyStats', { id, kills: player.kills });
    }
    addDeath(id) {
        const player = this.game.getActorById(id);
        player.deaths += 1;
        this.io.emit('lobbyStats', { id, deaths: player.deaths });
    }
}