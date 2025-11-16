import CGame from "../CGame";
import MyEventEmitter from "./MyEventEmitter";

export default class LobbyStats {
    constructor(game) {
        /**@type {CGame} */
        this.game = game;
        this.players = new Map();

        this.ui = this.makeUI();
        this.bindings();
    }
    bindings(){
        MyEventEmitter.on('playerNameUpdate', ({id, name})=>{
            this.updatePlayer(id);
        })
    }
    makeUI() {
        const container = document.createElement('div');
        container.id = "lobbystats-container";
        document.body.appendChild(container);

        const header = document.createElement('div');
        header.id = "lobbystats-header";
        header.innerHTML = "Player \t Kills \t Deaths";
        container.appendChild(header);

        return container;
    }
    addPlayer(id, data) {
        const actor = this.game.getActorById(id);
        if (!actor) return;

        const el = document.createElement('div');
        el.classList.add('lobbystats-item');
        this.ui.appendChild(el);

        const label = document.createElement('label');
        label.classList.add('lobbystats-label');
        label.innerText = `${actor.name} \t ${actor.kills || "0"} \t ${actor.deaths || "0"}`
        el.appendChild(label);

        this.players.set(id, {
            label,
        });
    }
    update(data) {
        const { id, damage, totalDamage, kills, deaths } = data;
        if (!id) return;
        const actor = this.game.getActorById(id);
        if (damage) {
            MyEventEmitter.emit('playerDidDamage', { id, damage });
        }
        if (totalDamage) {
            actor.totalDamage = totalDamage;
        }
        if (kills) {
            actor.kills = kills;
        }
        if (deaths) {
            actor.deaths = deaths;
        }

        const player = this.players.get(id)
        if (!player) this.addPlayer(id, data);
        else this.updatePlayer(id);
    }
    updatePlayer(id) {
        const actor = this.game.getActorById(id);
        const player = this.players.get(id);
        player.label.innerText = `${actor.name} \t ${actor.kills || "0"} \t ${actor.deaths || "0"}`
    }
}