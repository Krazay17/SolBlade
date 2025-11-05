import { Actor, randomPos } from "@solblade/shared";
import { io } from "../SMain.js";
import SGame from "../SGame.js";

export default class SActor extends Actor {
    constructor(game, data) {
        super(data);
        /**@type {SGame} */
        this.game = game;

        this.init();
    }
    get actorManager() { return this.game.actorManager }
    update(dt) {
        this.age = performance.now() - this.timestamp;
        if (this.lifetime) {
            if (this.age >= this.lifetime) this.destroy();
        }
    }
    activate(data = {}) {
        io.emit('newActor', this);
    }
    deActivate() {
        if (!this.active) return;
        super.deActivate();
        io.emit('actorEvent', { id: this.id, event: 'deactivate' });
    }
    destroy() {
        this.actorManager.removeActor(this);
    }
    hit(data) {
        if (!this.active) return;
        this.deActivate();
        io.emit('actorEvent', { id: this.id, event: "applyHit", data });
    }
    respawn(data = {}) {
        const {
            respawnTime = 1000,
            pos = randomPos(20, 10),
        } = data;
        setTimeout(() => {
            this.activate({ ...data, pos });
        }, respawnTime)
    }
}