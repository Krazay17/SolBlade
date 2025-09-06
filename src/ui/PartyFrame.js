import MyEventEmitter from "../core/MyEventEmitter";
import Globals from "../utils/Globals";

export default class PartyFrame {
    constructor() {
        this.players = new Map();

        this.container = document.createElement('div');
        this.container.id = 'party-frame';
        document.getElementById('game-data').appendChild(this.container);

        // MyEventEmitter.on('playerHealthChange', (player, health) => {
        //     const playerElement = this.players.get(player);
        //     if (playerElement) {
        //         const healthFill = playerElement.querySelector('.party-healthbar-fill');
        //         if (healthFill) {
        //             healthFill.style.width = `${health}%`;
        //         }
        //     }
        // });
        MyEventEmitter.on('playerNameUpdate', ({player, name}) => {
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
        
        healthBar.appendChild(healthFill);

        playerElement.appendChild(healthBar);
        playerElement.addEventListener('click', () => {
            this.selectPlayer(player);
        });

        this.container.appendChild(playerElement);
        this.players.set(player, playerElement);
    }

    removePlayer(player) {
        this.container.removeChild(this.players.get(player));
        this.players.delete(player);
    }

    selectPlayer(player) {
        Globals.player.body.position.copy(player.position);
    }

    render() {
        this.players.forEach(player => {
            const playerElement = document.createElement('div');
            playerElement.className = 'party-player';
            playerElement.innerText = player.name;

            const healthBar = document.createElement('div');
            healthBar.className = 'party-healthbar';
            const healthFill = document.createElement('div');
            healthFill.className = 'party-healthbar-fill';
            healthFill.style.width = `${player.health}%`;
            healthBar.appendChild(healthFill);

            playerElement.appendChild(healthBar);
            this.container.appendChild(playerElement);
            playerElement.addEventListener('click', () => {
                this.selectPlayer(player);
            });
            this.players.set(player, playerElement);
        });
    }
}
