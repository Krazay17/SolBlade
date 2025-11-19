import SEnergy from "../core/SEnergy.js";
import { io } from "../SMain.js";
import SHealth from "../core/SHealth.js";
import SPawn from "./SPawn.js";

export default class SPlayer extends SPawn {
    constructor(game, data) {
        super(game, data);
        // this.health = new SHealth(this, 100, data.currentHealth);
        // this.health.onChange = (v) => this.data.currentHealth = v
        // this.health.onDeath = () => this.die();
        this.kills = 0;
        this.deaths = 0;

        this.energy = new SEnergy(this, 100);

        this.lastHit = null;
    }
    serialize() {
        return {
            ...this.data,
            id: this.id,
            type: this.type,
            name: this.name,
            owner: this.owner,
            sceneName: this.sceneName,
            tempId: this.tempId,

            pos: this.pos?.toArray ? this.pos.toArray() : this.pos,
            dir: this.dir?.toArray ? this.dir.toArray() : this.dir,
            rot: this.rot?.toArray ? this.rot.toArray() : this.rot,

            active: this.active,
            isRemote: this.isRemote,
            lifetime: this.lifetime,
            respawntime: this.respawntime,

            age: this.age,
            timestamp: this.timestamp,
            kills: this.kills,
            deaths: this.deaths,
        }
    }
    destroy() {
        this.actorManager.removeActor(this);
    }
    hit(data) {
        const { amount, dealer } = data;
        const dealerActor = this.actorManager.getActorById(dealer);
        if (amount > 0 && this.parry) {
            io.emit('playerParried', { target: this.id, dealer });
            if (dealerActor.parry) io.emit('playerParried', { target: dealer, dealer: this.id })
            return;
        }
        this.lastHit = data;
        io.emit('actorHit', { id: this.id, data });
        if (this.isDead) return 0;
        //io.emit('actorEvent', { id: this.id, event: "applyHit", data });
        this.health.subtract(amount);

        if (this.lastHitTimer) clearTimeout(this.lastHitTimer);
        this.lastHitTimer = setTimeout(() => {
            this.lastHit = null;
        }, 5000);

        return amount;
    }
    die() {
        if (this.isDead) return;
        this.isDead = true;
        const targetName = this.name;
        let dealerName = 'The Void';
        io.emit('playerDied', this.lastHit || { target: this.id });
        this.game.lobbyStats.addDeath(this.id);

        this.respawn();

        if (this.lastHit && this.lastHit.dealer) {
            dealerName = this.actorManager.getActorById(this.lastHit.dealer).name;
            this.game.lobbyStats.addKill(this.lastHit.dealer);
            this.game.lobbyStats.addDamage(this.lastHit.dealer, this.health.current);
        }
        this.health.subtract(this.health.current);
        io.emit('serverMessage', { player: 'Server', message: `${targetName} slain by: ${dealerName}`, color: 'orange' });
    }
    respawn() {
        setTimeout(() => {
            this.isDead = false
            this.health.current = this.health.maxHealth;
            //io.emit('actorEvent', {id:this.id, event: "unDie"});
        }, 2500)
    }
}