import * as THREE from "three";
import Game from "../../CGame.js";

export default class FX {
    constructor(game, data) {
        /**@type {Game} */
        this.game = game;
        this.data = data;
        this.graphics = new THREE.Object3D();
        this.pos = data.pos ?? new THREE.Vector3();
        this.dir = data.dir ?? new THREE.Vector3();
        this.scale = data.scale ?? 1;
        this.graphics.position.copy(this.pos);
        this.game.graphics.add(this.graphics);
        this.active = true;
        this.upVec = new THREE.Vector3(0, 1, 0);
        this.meshName = data.meshName ?? "AttackTrail";
        this.offset = data.offset ?? null;
        this.color = data.color ?? 'red';
        this.delta = 0;
        this.duration = data.dur ?? 1000;
        this.timeStamp = this.game.time;

        this.init();
    }
    set position(pos) { this.graphics.position.copy(pos) }
    init() { }
    update(dt, time) {
        if (!this.active) return;
        this.delta = Math.min(1, (this.game.time - this.timeStamp) / this.duration)
        if (this.delta === 1) {
            this.destroy();
        }
    }
    destroy() {
        this.active = false;
        this.game.graphics.remove(this.graphics);
    }
}