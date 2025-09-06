import MyEventEmitter from "../core/MyEventEmitter.js";
import LocalData from "../core/LocalData.js";
import PartyFrame from "./PartyFrame.js";
import './PlayerInfoStyle.css';
import { netSocket } from "../core/NetManager.js";

export default class PlayerInfo {
    constructor() {
        this.name = LocalData.name || "Player";
        this.money = LocalData.money || 0;
        this.health = LocalData.health || 100;
        this.energy = 100;
        this.partyFrame = null;
        this.actor = null;

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
                netSocket.emit('playerNameSend', this.name);
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
        MyEventEmitter.on('updateHealth', (newHealth) => {
            this.health = newHealth;
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
            if (this.energy < this.actor.dashCost || this.energy < 35) {
                energyBar.style.backgroundColor = 'rgba(255, 102, 0, 1)';
            } else {
                energyBar.style.backgroundColor = 'rgba(255, 255, 0, 1)';
            }
        });
        energyBarContainer.appendChild(energyBar);
        container.appendChild(energyBarContainer);
    }

    setActor(actor) {
        this.actor = actor;
    }

    createPartyFrame() {
        if (!this.partyFrame) {
            this.partyFrame = new PartyFrame();
            MyEventEmitter.on('addPartyMember', (newPlayer) => {
                this.partyFrame.addPlayer(newPlayer);
            });
            MyEventEmitter.on('removePartyMember', (removedPlayer) => {
                this.partyFrame.removePlayer(removedPlayer);
            });
        }
    }
}