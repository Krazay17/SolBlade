import SEnergy from "../core/SEnergy.js";
import { io } from "../SMain.js";
import SHealth from "../core/SHealth.js";
import SActor from "./SActor.js";

export default class SPlayer extends SActor {
    constructor(game, data) {
        super(game, data);
        this.health = new SHealth(this, 100, data.currentHealth);
        this.health.onChange = (v) => this.data.currentHealth = v
        this.health.onDeath = () => this.die();
        this.damage = 0;
        this.totalDamage = 0;
        this.kills = 0;
        this.deaths = 0;

        this.energy = new SEnergy(this, 100);

        this.lastHit = null;
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
    die(data) {
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
        }
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