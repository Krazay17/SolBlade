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
            const data = this.players.get(this.player);
            this.players.delete(this.player);
            this.player = id;
            this.players.set(id, { ...data, id });
        });
        MyEventEmitter.on('playerNameUpdate', ({ id, name }) => {
            const player = this.players.get(id);
            player.name = name;
            this.render();
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

            this.render();
        });
        MyEventEmitter.on('playerDisconnected', (id) => {
            this.removePlayer(id);
        });
        MyEventEmitter.on('resetDps', () => this.reset());
        MyEventEmitter.on('disconnect', () => {
            for (const p of this.players.keys()) {
                if (p === this.player) continue;
                this.removePlayer(p);
            }
        })
    }
    removePlayer(id) {
        const player = this.players.get(id);
        this.ui.removeChild(player.el.root);

        this.players.delete(id);
    }
    render() {
        const data = [...this.players.values()];
        data.sort((a, b) => b.damage - a.damage);
        for (const d of data) {
            this.ui.appendChild(d.el.root);
            d.el.label.innerText = d.name;
            const fillpercent = d.damage / this.allDamage;
            d.el.barfill.offsetWidth;
            d.el.barfill.style.width = `${fillpercent * 100}%`;
            d.el.number.innerText = Math.floor(d.damage);
        }
    }
    reset() {
        for (const d of this.players.values()) {
            console.log(d);
            d.damage = 0;
            d.el.barfill.style.width = "0%";
        }
        this.allDamage = 0;
        this.render();
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
        const el = this.createRow(name);
        this.ui.appendChild(el.root);

        this.players.set(id, { id, name, damage: 0, el });
        return id;
    }
    createRow(name) {
        const root = document.createElement('div');
        root.classList.add('dps-bar');

        const barfill = document.createElement('div');
        barfill.classList.add('dps-bar-fill');
        barfill.style.width = "0%"


        const label = document.createElement('div');
        label.classList.add("dps-label");
        label.innerText = name;

        const number = document.createElement('div');
        number.classList.add('dps-number');
        number.innerText = "0";

        root.append(barfill, label, number);

        return { root, barfill, label, number };
    }
}