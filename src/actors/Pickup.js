import * as THREE from 'three';
import Actor from './Actor.js';

export default class Pickup extends Actor {
    constructor(scene, data) {
        data.health = 1;
        super(scene, data);
        this.active = true;
        /**@type {THREE.Object3D} */
        this.mesh = null;

        this.height = 0;
        this.tempVector = new THREE.Vector3();
    }
    async makeMesh(name, scale = 1) {
        this.mesh = await this.scene.meshManager.getMesh(name);
        const edges = new THREE.EdgesGeometry(this.mesh.children[0].children[0].geometry, 35);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff }));
        this.mesh.add(line);
        this.mesh.scale.set(scale, scale, scale);
        this.add(this.mesh);
    }
    onTouch(dealer) {
        this.game.soundPlayer.applyPosSound('pickup', this.position);
    }
    applyTouch(data) {
        super.applyTouch(data);
        this.applyDestroy();
    }
    checkDistanceToPlayer() {
        const player = this.scene.player;
        if (player.isDead) return;
        const adjustPos = this.tempVector.copy(this.position);
        adjustPos.y += this.height;
        const dist = player.position.distanceToSquared(adjustPos)
        if (dist < 2.55) {
            this.touch(player);
        }
    }
    update(dt, time) {
        if (!this.active) return;
        this.checkDistanceToPlayer();
    }
}