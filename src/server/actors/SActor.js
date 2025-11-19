import { Actor } from "@solblade/shared";
import { io } from "../SMain.js";
import SGame from "../SGame.js";
import {vec3} from 'gl-matrix';


export default class SActor extends Actor {
    constructor(game, data) {
        super(data);
        /**@type {SGame} */
        this.game = game;
        this.onDeactivate = null;
        this._yaw = 0;
        this.auth = false;

        this.lastPos;
        this.lastRot;

        this.init();
    }
    get actorManager() { return this.game.actorManager }
    get rotY() { return this._yaw };
    set rotY(r) {
        this._yaw = r;
        const halfYaw = v * 0.5;
        this.rot = {
            x: this.rot.x || 0,
            y: Math.sin(halfYaw),
            z: this.rot.z || 0,
            w: Math.cos(halfYaw)
        };
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
        // DEACTIVATE IS DESTROYING ON CLIENT FOR NOW
        this.game.io.emit('actorEvent', { id: this.id, event: 'destroy' });
        if (this.onDeactivate) this.onDeactivate();
    }
    onCollide() {
        io.emit('actorEvent', { id: this.id, event: "onCollide" });
    }
    destroy() {
        this.actorManager.removeActor(this);
    }
    hit(data) {
        if (!this.active) return;
        io.emit('actorHit', { id: this.id, data });
        //io.emit('actorEvent', { id: this.id, event: "applyHit", data });
    }
    respawn(respawnTime) {
        setTimeout(() => {
            this.activate();
        }, respawnTime)
    }
}