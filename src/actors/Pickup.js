import * as THREE from 'three';
import Globals from '../utils/Globals.js';
import MyEventEmitter from '../core/MyEventEmitter.js';
import soundPlayer from '../core/SoundPlayer.js';
import Actor from './Actor.js';
import GameScene from '../scenes/GameScene.js';

export default class Pickup extends Actor {
    constructor(scene, position, netId) {
        super(scene);
        /**@type {GameScene} */
        this.position.set(position.x, position.y, position.z);
        this.netId = String(netId) || null;
        this.active = true;
        /**@type {THREE.Mesh} */
        this.mesh = null;

        if (!Pickup.netFx) {
            MyEventEmitter.on('netFx', (data) => {
                if (data.type === 'pickup') {
                    Pickup.pickupFx(new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z));
                }
            });
            Pickup.netFx = true;
        }

        this.scene.graphics.add(this);
    }
    static pickupFx(pos) {
        soundPlayer.playPosAudio('pickup', pos, '/assets/Pickup.mp3');
    }
    async makeMesh(name, scale = 1) {
        this.mesh = await this.scene.meshManager.getMesh(name);
        this.mesh.scale.set(scale, scale, scale);
        this.add(this.mesh);
    }
    onCollect(player) {
        if (!this.active) return;
        this.active = false;
        Pickup.pickupFx(this.position);
        MyEventEmitter.emit('fx', { type: 'pickup', pos: this.position });
        MyEventEmitter.emit('pickupCollected', { netId: this.netId, item: this });
    }
    applyCollect(player) { }
}