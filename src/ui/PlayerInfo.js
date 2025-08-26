import MyEventEmitter from "../core/MyEventEmitter";
import LocalData from "../core/LocalData";
import './PlayerInfoStyle.css';

export default class PlayerInfo {
    constructor() {
        this.name = LocalData.name || "Player";
        this.money = LocalData.money || 0;
        this.health = LocalData.health || 100;
        this.mana = LocalData.mana || 50;
    }
    createUI() {
        const container = document.createElement('div');
        container.id = 'player-info-container';

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

        const manaBarContainer = document.createElement('div');
        manaBarContainer.id = 'mana-bar-container';
        const manaBar = document.createElement('div');
        manaBar.id = 'mana-bar';
        manaBar.style.width = `${this.mana}%`;
        manaBarContainer.appendChild(manaBar);
        container.appendChild(manaBarContainer);

        document.body.appendChild(container);
    }
}