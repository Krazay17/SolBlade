import MyEventEmitter from "../../../core/MyEventEmitter";
import Game from "../CGame";

export default class PartyFrame {
    constructor() {
        this.players = {};

        this.container = document.createElement('div');
        this.container.id = 'party-frame';
        document.getElementById('game-data').appendChild(this.container);

        MyEventEmitter.on('disconnect', () => {
            for (const id of Object.keys(this.players)) {
                this.removePlayer(id)
            }
            this.players = {};
        })

        MyEventEmitter.on('playerConnected', (player) => {
            const { id } = player;
            if (this.players[id]) return;
            this.addPlayer(player);
        });
        MyEventEmitter.on('playerDisconnected', (id) => {
            console.log(`player disconnected ${id}`);
            this.removePlayer(id);
        });
        MyEventEmitter.on('playerNameUpdate', ({ id, name }) => {
            if (this.players[id]?.nameEl) {
                this.players[id].nameEl.innerText = name;
            }
        });
    }

    addPlayer(player) {
        const playerElement = document.createElement('div');
        playerElement.className = 'party-player';
        const nameEl = document.createElement('span');
        nameEl.innerText = player.name;
        playerElement.appendChild(nameEl);

        const healthBar = document.createElement('div');
        healthBar.className = 'party-healthbar';
        const healthFill = document.createElement('div');
        healthFill.className = 'party-healthbar-fill';
        healthFill.style.width = `${player.health}%`;
        MyEventEmitter.on('playerHealthChangeLocal', ({ id, health }) => {
            if (player.id === id) {
                healthFill.style.width = `${health}%`;
            }
        })

        healthBar.appendChild(healthFill);

        playerElement.appendChild(healthBar);


        this.container.appendChild(playerElement);
        this.players[player.id] = { player, playerElement, nameEl };
    }

    removePlayer(id) {
        if (!id) return;
        const el = this.players[id].playerElement;
        if (!el) return;
        this.container.removeChild(el);
        delete this.players[id];
    }
}
