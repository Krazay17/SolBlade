import CGame from "../CGame";
import MyEventEmitter from "./MyEventEmitter";

export default class DPSMeter {
    constructor(game, data) {
        /**@type {CGame} */
        this.game = game;
        this.data = data;

        this.ui = this.createUI();

        this.players = new Map();
        this.allDamage = 0;

        this.player = this.addPlayer(game.player.id, game.player.name);
        this.bindings();
    }
    bindings() {
        MyEventEmitter.on('playerIdChange', (id) => {
            console.log(this.player);
            const oldId = this.player.id;
            const player = this.players.get(oldId);

            this.players.delete(oldId);
            this.players.set(id, player);
            this.player.id = id;
        });
        MyEventEmitter.on('playerNameUpdate', ({ id, name }) => {
            const player = this.players.get(id);
            player.name = name;
            this.update();
        })
        MyEventEmitter.on('playerConnected', (p) => {
            const { id, name } = p;
            this.addPlayer(id, name);
        });
        MyEventEmitter.on('playerDidDamage', ({ id, damage }) => {
            const player = this.players.get(id);
            if (!player) return;
            player.damage += damage;
            this.allDamage += damage;

            this.update();
        });
        MyEventEmitter.on('playerDisconnected', (id) => {
            this.removePlayer(id);
        });
        MyEventEmitter.on('resetDps', () => this.reset());
    }
    removePlayer(id) {
        const player = this.players.get(id);
        this.ui.removeChild(player.bar.bar);

        this.players.delete(id);
    }
    update() {
        const data = [...this.players.values()];
        data.sort((a, b) => b.damage - a.damage);
        for (const d of data) {
            this.ui.appendChild(d.bar.bar);
            d.bar.label.innerText = d.name;
            const fillpercent = d.damage / this.allDamage;
            d.bar.barfill.offsetWidth;
            d.bar.barfill.style.width = `${fillpercent * 100}%`;
            d.bar.number.innerText = Math.floor(d.damage);
        }
    }
    reset() {
        for (const d of this.players.values()) {
            d.damage = 0;
            d.bar.barfill.style.width = "0%";
        }
        this.allDamage = 0;
        this.update();
    }
    createUI() {
        const container = document.createElement('div');
        container.id = 'dpsmeter-container';
        document.body.appendChild(container);

        const button = document.createElement('button');
        button.classList.add('dps-reset-button');
        button.innerText = "Reset";
        container.appendChild(button);
        button.addEventListener('mousedown', () => this.reset())

        const barContainer = document.createElement('div');
        barContainer.id = 'dpsmeter-bar-container';
        container.appendChild(barContainer);

        return barContainer;
    }
    addPlayer(id, name) {
        const bar = this.addBar(name);
        const playerData = {
            id,
            name,
            damage: 0,
            bar,
        }

        this.players.set(id, playerData);
        return playerData;
    }
    addBar(name) {
        const bar = document.createElement('div');
        bar.classList.add('dps-bar');
        this.ui.appendChild(bar);

        const barfill = document.createElement('div');
        barfill.classList.add('dps-bar-fill');
        barfill.style.width = "10%"
        bar.appendChild(barfill);

        const label = document.createElement('div');
        label.classList.add("dps-label");
        label.innerText = name;
        bar.appendChild(label);

        const number = document.createElement('div');
        number.classList.add('dps-number');
        number.innerText = "0";
        bar.appendChild(number);

        return { bar, barfill, label, number };
    }
}