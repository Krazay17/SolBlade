import * as THREE from 'three';
import Globals from '../utils/Globals.js';
import MyEventEmitter from '../core/MyEventEmitter.js';
import soundPlayer from '../core/SoundPlayer.js';

export default class Pickup extends THREE.Object3D {
    constructor(scene, type, position, itemId = null) {
        super();
        this.scene = scene;
        this.type = type;
        this.mesh = null;
        this.position.set(position.x, position.y, position.z);
        this.itemId = String(itemId);
        this.active = true;

        if (!Pickup.netFx) {
            MyEventEmitter.on('netFx', (data) => {
                if (data.type === 'pickup') {
                    Pickup.pickupFx(new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z));
                }
            });

            Pickup.netFx = true;
        }
    }

    async createPickupMesh(scale = 1) {
        switch (this.type) {
            case 'energy':
                this.mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.5, 16, 16),
                    new THREE.MeshBasicMaterial({ color: 0xffff00 })
                );
                this.add(this.mesh);
                break;
            case 'health':
                this.mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.5, 16, 16),
                    new THREE.MeshBasicMaterial({ color: 0x00ff00 })
                );
                this.add(this.mesh);
                break;
            // case 'item':
            //     this.mesh = new THREE.Mesh(
            //         new THREE.SphereGeometry(0.5, 16, 16),
            //         new THREE.MeshBasicMaterial({ color: 0xffffff })
            //     );
            //     this.add(this.mesh);
            //     break;
            default:
                this.mesh = await this.scene.meshManager.getMesh(this.type, scale);
                break;
        }
        if (this.mesh) {
            this.add(this.mesh);
        }
    }

    onCollect(player) {
        if (!this.active) return;
        this.active = false;
        Pickup.pickupFx(this.position);
        MyEventEmitter.emit('fx', { type: 'pickup', pos: this.position });
        MyEventEmitter.emit('pickupCollected', { itemId: this.itemId, item: this });
    }

    static pickupFx(pos) {
        soundPlayer.playPosAudio('pickup', pos, '/assets/Pickup.mp3');
    }

    static crownFx(mesh) {
        Globals.player.add(mesh);
    }

    applyCollect(player) {
        switch (this.type) {
            case 'crown':
                MyEventEmitter.emit('pickupCrown');
                break;
            case 'energy':
                player.addEnergy(100);
                break;
            case 'health':
                player.takeHealing('HealthOrb', { amount: 25 });
                break;
            default:
                console.log(`no pickup type: ${this.type}`);
        }
    }
}