import { Actor, randomPos } from "@solblade/shared";
import { io } from "../SMain.js";
import SGame from "../SGame.js";

export default class SActor extends Actor {
    constructor(game, data) {
        super(data);
        /**@type {SGame} */
        this.game = game;
        this.onDeactivate = null;
        this._yaw = 0;
        this.auth = false;

        this.init();
    }
    get actorManager() { return this.game.actorManager }
    get rotY() { return this._yaw };
    set rotY(r) {
        this._yaw = r;
        const halfYaw = this._yaw * 0.5;
        const sin = Math.sin(halfYaw);
        const cos = Math.cos(halfYaw);
        const q = { x: this.rot.x, y: sin, z: this.rot.z, w: cos };
        this.rot = q;
    }
    update(dt) {
        this.age = performance.now() - this.timestamp;
        if (this.lifetime) {
            if (this.age >= this.lifetime) this.destroy();
        }
    }
    activate() {
        this.active = true;
        io.emit('newActor', this.serialize());
    }
    deActivate() {
        if (!this.active) return;
        super.deActivate();
        io.emit('actorEvent', { id: this.id, event: 'deactivate' });
        if (this.onDeactivate) this.onDeactivate();
    }
    destroy() {
        this.actorManager.removeActor(this);
    }
    hit(data) {
        if (!this.active) return;
        this.deActivate();
        io.emit('actorEvent', { id: this.id, event: "applyHit", data });
    }
    respawn(respawnTime) {
        setTimeout(() => {
            this.activate();
        }, respawnTime)
    }
}