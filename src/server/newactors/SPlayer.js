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
        this.lastHit = null;

        this.energy = new SEnergy(this, 100);
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
        this.health.subtract(data.amount);
        this.lastHit = data;
        io.emit('actorEvent', { id: this.id, event: "applyHit", data });
    }
    die(data) {
        this.isDead = true;
        io.emit('actorEvent', { id: this.id, event: "die", data: data || this.lastHit });
        this.respawn();
    }
    respawn() {
        setTimeout(() => {
            this.health.current = this.health.maxHealth;
            this.isDead = false
            //io.emit('actorEvent', {id:this.id, event: "unDie"});
        }, 2500)
    }
}