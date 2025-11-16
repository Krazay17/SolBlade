import CGame from "../../CGame";
import LocalData from "../../core/LocalData";
import MyEventEmitter from "../../core/MyEventEmitter";
import Player from "../../player/Player";
import "./StyleFrames.css";

export default class PlayerFrames {
    constructor(game, player) {
        /**@type {CGame} */
        this.game = game;
        /**@type {Player} */
        this.player = player;

        this.players = new Map();

        this.playerUI = this.initPlayer();
        this.partyUI = this.initParty();

        this.bindings();
    }
    bindings() {
        MyEventEmitter.on('disconnect', () => {
            for (const p of this.players.keys()) {
                this.removePlayer(p);
            }
        });
        MyEventEmitter.on('playerConnected', (p) => {
            this.addPlayer(p.id, p);
        });
        MyEventEmitter.on('playerHealthChange', ({ id, health }) => {
            this.playerUI.healthfill.style.width = `${health}%`;
        });
        MyEventEmitter.on('playerDisconnected', (id) => {
            this.removePlayer(id);
        });
        MyEventEmitter.on('playerHealthChangeLocal', ({ id, health }) => {
            if (id === this.player.id) return;
            const player = this.players.get(id);
            player.healthfill.style.width = `${health}%`;
        });
        MyEventEmitter.on('playerNameUpdate', ({ id, name }) => {
            const player = this.players.get(id);
            player.name = name;
            player.nameEl.innerText = `${name} \t ${player.sceneName} \t KD: ${player.kills}/${player.deaths}`;
        });
        MyEventEmitter.on('playerNewScene', ({ id, sceneName }) => {
            const player = this.players.get(id);
            player.label = `${player.name} \t ${sceneName}`
        });
        MyEventEmitter.on('updateEnergy', (newEnergy) => {
            const energy = this.player.energy.current;
            const energyBar = this.playerUI.energyfill;

            energyBar.style.width = `${newEnergy}%`;
            if (energy < this.player.dashCost || this.player.getDimmed()) {
                energyBar.style.backgroundColor = 'rgba(255, 81, 0, 1)';
            } else if (energy < this.player.doubleJumpCost) {
                energyBar.style.backgroundColor = 'rgba(255, 145, 0, 1)';
            } else {
                energyBar.style.backgroundColor = 'rgba(255, 255, 0, 1)';
            }
        });
        MyEventEmitter.on('localStatsUpdate', (data) => {
            const player = this.players.get(data.id);
            if (!player) return;
            player.nameEl.innerText = `${player.name} \t ${player.sceneName} \t KD: ${data.kills || player.kills}/${data.deaths || player.deaths}`;
        });
        this.playerUI.root.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const newName = prompt("Enter your name: ", this.player.name);
            if (newName) {
                this.player.name = newName;
                this.playerUI.nameEl.innerText = newName;
                LocalData.name = newName;
                LocalData.save();
                MyEventEmitter.emit('playerNameChange', newName);
            }
        })
    }
    initPlayer() {
        const root = document.createElement('div');
        root.id = "frame-player";
        document.body.appendChild(root);

        const nameEl = document.createElement('div');
        nameEl.classList.add('frame-player-label');
        nameEl.innerText = this.player.name;

        const health = document.createElement('div');
        health.classList.add('frame-health');

        const healthfill = document.createElement('div');
        healthfill.classList.add('frame-health-fill');
        const healthPC = this.player.health.current / this.player.health.maxHealth * 100;
        healthfill.style.width = `${healthPC}%`;

        const energy = document.createElement('div');
        energy.classList.add('frame-energy');

        const energyfill = document.createElement('div');
        energyfill.classList.add('frame-energy-fill');
        const energyPC = this.player.energy.current / this.player.energy.max * 100;
        healthfill.style.width = `${energyPC}%`;

        health.appendChild(healthfill);
        energy.appendChild(energyfill);
        root.append(nameEl, health, energy);

        return { root, nameEl, healthfill, energyfill };
    }
    initParty() {
        const root = document.createElement('div');
        root.id = "frame-party";
        document.body.appendChild(root);

        return root;
    }
    makeRow(name, sceneName, currentHealth, kills, deaths) {
        const root = document.createElement('div');
        root.classList.add("frame-party-member");
        this.partyUI.appendChild(root);

        const nameEl = document.createElement('div');
        nameEl.classList.add('frame-player-label');
        nameEl.innerText = `${name} \t ${sceneName} \t KD: ${kills}/${deaths}`;

        const health = document.createElement('div');
        health.classList.add('frame-health');

        const healthfill = document.createElement('div');
        healthfill.classList.add('frame-health-fill');
        const healthPC = currentHealth / 100 * 100;
        healthfill.style.width = `${healthPC}%`;

        health.appendChild(healthfill);
        root.append(nameEl, health);

        return { root, nameEl, healthfill, name, sceneName, currentHealth, kills, deaths };
    }
    addPlayer(id, data) {
        const { name, sceneName, currentHealth, kills, deaths } = data;
        this.players.set(id, this.makeRow(name, sceneName, currentHealth, kills, deaths));
    }
    removePlayer(id) {
        const player = this.players.get(id)
        if (!player) return;
        player.root.remove();
    }
}