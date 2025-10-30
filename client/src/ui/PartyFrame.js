import MyEventEmitter from "../core/MyEventEmitter";
import Globals from "../utils/Globals";

export default class PartyFrame {
    constructor() {
        this.players = new Map();

        this.container = document.createElement('div');
        this.container.id = 'party-frame';
        document.getElementById('game-data').appendChild(this.container);

        MyEventEmitter.on('disconnect', () => {
            for (const [p, el] of this.players) {
                this.removePlayer(p)
            }
            this.players.clear();
        })

        MyEventEmitter.on('playerConnected', (player) => {
            if(this.players.has(player))return;
            this.addPlayer(player);
        });
        MyEventEmitter.on('playerDisconnected', (player) => {
            this.removePlayer(player);
        });
        MyEventEmitter.on('playerNameUpdate', ({ player, name }) => {
            const playerElement = this.players.get(player);
            if (playerElement) {
                playerElement.innerText = name;
            }
        });
    }

    addPlayer(player) {
        const playerElement = document.createElement('div');
        playerElement.className = 'party-player';
        playerElement.innerText = player.name;

        const healthBar = document.createElement('div');
        healthBar.className = 'party-healthbar';
        const healthFill = document.createElement('div');
        healthFill.className = 'party-healthbar-fill';
        healthFill.style.width = `${player.health}%`;
        MyEventEmitter.on('playerHealthChangeLocal', ({ id, health }) => {
            if (player.netId === id) {
                healthFill.style.width = `${health}%`;
            }
        })

        healthBar.appendChild(healthFill);

        playerElement.appendChild(healthBar);
        playerElement.addEventListener('click', () => {
            //this.selectPlayer(player);
        });

        playerElement.addEventListener('mousedown', (e) => {
            if (e.button === 1) {
                e.preventDefault();
                MyEventEmitter.emit('bootPlayer', player);
            }
        });

        this.container.appendChild(playerElement);
        this.players.set(player, playerElement);
    }

    removePlayer(player) {
        if (!player) return;
        const el = this.players.get(player)
        if (!el) return;
        this.container.removeChild(el);
        this.players.delete(player);
    }

    selectPlayer(player) {
        Globals.player.body.position = player.pos;
    }
}
