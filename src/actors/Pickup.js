import * as THREE from 'three';
import MyEventEmitter from '../core/MyEventEmitter.js';
import soundPlayer from '../core/SoundPlayer.js';
import Actor from './Actor.js';
import TouchData from '../core/TouchData.js';

export default class Pickup extends Actor {
    constructor(scene, data) {
        super(scene, data);
        this.active = true;
        /**@type {THREE.Mesh} */
        this.mesh = null;

        this.height = 0;
        this.tempVector = new THREE.Vector3();

        if (!Pickup.netFx) {
            MyEventEmitter.on('netFx', (data) => {
                if (data.type === 'pickup') {
                    Pickup.pickupFx(new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z));
                }
            });
            Pickup.netFx = true;
        }
    }
    static pickupFx(pos) {
        soundPlayer.playPosAudio('pickup', pos, '/assets/Pickup.mp3');
    }
    async makeMesh(name, scale = 1) {
        this.mesh = await this.scene.meshManager.getMesh(name);
        this.mesh.scale.set(scale, scale, scale);
        this.add(this.mesh);
    }
    touch(dealer) {
        if (!this.active) return;
        this.active = false;
        Pickup.pickupFx(this.position);
        super.touch(dealer);
    }
    applyTouch(data) {
        this.die(data);
    }
    checkDistanceToPlayer() {
        const player = this.scene.player;
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