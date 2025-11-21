import MyEventEmitter from "../../../_new/core/MyEventEmitter.js";
import LocalData from "../core/LocalData.js";
import Game from "../CGame.js";

export default class PlayerInfo {
    constructor(player) {
        this.name = LocalData.name || "Player";
        this.money = LocalData.money || 0;
        this.health = LocalData.health || 100;
        this.energy = 100;
        this.player = player;

        this.createUI();
    }
    createUI() {
        const container = document.createElement('div');
        container.id = 'player-info-container';
        document.getElementById('game-data').appendChild(container);

        const nameBarElem = document.createElement('div');
        nameBarElem.id = 'name-bar';
        const nameElem = document.createElement('div');
        nameElem.id = 'player-name';
        nameElem.textContent = this.name;

        nameBarElem.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const newName = prompt("Enter your new name:", this.name);
            if (newName) {
                this.name = newName;
                nameElem.textContent = this.name;
                MyEventEmitter.emit('playerNameChange', this.name);
                LocalData.name = this.name;
                LocalData.save();
            }
        });
        nameBarElem.appendChild(nameElem);
        container.appendChild(nameBarElem);

        const moneyElem = document.createElement('div');
        moneyElem.textContent = `Source: ${this.money}`;
        container.appendChild(moneyElem);

        const healthBarContainer = document.createElement('div');
        healthBarContainer.id = 'health-bar-container';
        const healthBar = document.createElement('div');
        healthBar.id = 'health-bar';
        healthBar.style.width = `${this.health}%`;
        MyEventEmitter.on('playerHealthChange', ({ id, health }) => {
            if (id !== Game.getGame().player.id) return;
            this.health = health;
            healthBar.style.width = `${this.health}%`;
        });
        healthBarContainer.appendChild(healthBar);
        container.appendChild(healthBarContainer);

        const energyBarContainer = document.createElement('div');
        energyBarContainer.id = 'energy-bar-container';
        const energyBar = document.createElement('div');
        energyBar.id = 'energy-bar';
        energyBar.style.width = `${this.energy}%`;
        MyEventEmitter.on('updateEnergy', (newEnergy) => {
            this.energy = newEnergy;
            energyBar.style.width = `${this.energy}%`;
            if (this.energy < this.player.dashCost || this.player.getDimmed()) {
                energyBar.style.backgroundColor = 'rgba(255, 81, 0, 1)';
            } else if (this.energy < this.player.doubleJumpCost) {
                energyBar.style.backgroundColor = 'rgba(255, 145, 0, 1)';
            } else {
                energyBar.style.backgroundColor = 'rgba(255, 255, 0, 1)';
            }
        });
        energyBarContainer.appendChild(energyBar);
        container.appendChild(energyBarContainer);
    }
}