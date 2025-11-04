import * as THREE from "three";
import Game from "../../CGame.js";

export default class FX {
    constructor(game, data) {
        /**@type {Game} */
        this.game = game;
        this.data = data;
        this.graphics = new THREE.Object3D();
        this.graphics.position.copy(data.pos || new THREE.Vector3());
        this.game.graphics.add(this.graphics);
        this.active = true;

        this.duration = data.dur ?? 1000;
        this.timeStamp = this.game.time;

        this.init();
    }
    set position(pos) { this.graphics.position.copy(pos) }
    init() {

    }
    update(dt, time) {
        if (!this.active) return;
        if (time > this.timeStamp + this.duration) {
            this.destroy();
        }
    }
    destroy() {
        this.active = false;
        this.game.graphics.remove(this.graphics);
    }
}