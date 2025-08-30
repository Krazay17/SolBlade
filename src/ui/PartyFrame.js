import MyEventEmitter from "../core/MyEventEmitter";

export default class PartyFrame {
    constructor(actor, scene) {
        this.players = new Map();
        this.actor = actor;
        this.scene = scene;

        this.container = document.createElement('div');
        this.container.id = 'party-frame';
        document.body.appendChild(this.container);

        MyEventEmitter.on('playerHealthChange', (player, health) => {
            const playerElement = this.players.get(player);
            if (playerElement) {
                const healthFill = playerElement.querySelector('.party-healthbar-fill');
                if (healthFill) {
                    healthFill.style.width = `${health}%`;
                }
            }
        });
        MyEventEmitter.on('playerNameChange', (player, name) => {
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
        this.container.appendChild(playerElement);
        playerElement.addEventListener('click', () => {
            this.selectPlayer(player);
        });

        this.players.set(player, playerElement);
    }

    removePlayer(player) {
        this.container.removeChild(this.players.get(player));
        this.players.delete(player);
    }

    selectPlayer(player) {
        this.actor.body.position.copy(player.position);
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
