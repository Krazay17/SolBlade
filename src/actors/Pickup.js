import * as THREE from 'three';
import { netSocket } from '../core/NetManager.js';
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

        this.createPickupMesh();

        if (!Pickup.netFx) {
            MyEventEmitter.on('netFx', (data) => {
                if (data.type === 'pickup') {
                    Pickup.pickupFx(new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z));
                }
            });

            Pickup.netFx = true;
        }
    }

    createPickupMesh() {
        switch (this.type) {
            case 'energy':
                const geometry = new THREE.SphereGeometry(0.5, 16, 16);
                const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
                this.mesh = new THREE.Mesh(geometry, material);
                this.add(this.mesh);
                break;
            default:
                Globals.game.glbLoader.load(`assets/${this.type}.glb`, (gltf) => {
                    this.mesh = gltf.scene;
                    this.mesh.scale.set(0.5, 0.5, 0.5);
                    this.mesh.children[0].receiveShadow = true;
                    this.mesh.children[0].castShadow = true;
                    this.add(this.mesh);
                });
        }
    }

    onCollect(player) {
        if(!this.active) return;
        this.active = false;
        Pickup.pickupFx(this.position);
        MyEventEmitter.emit('fx', { type: 'pickup', pos: this.position });
        MyEventEmitter.emit('pickupCollected', { itemId: this.itemId });
    }

    static pickupFx(pos) {
        soundPlayer.playPosAudio('pickup', pos, '/assets/Pickup.mp3');
    }

    applyCollect(player) {
        if (this.type === 'crown') {
            this.scene.gameMode.startGame();
        }

        if (this.type === 'energy') {
            player.addEnergy(100);
        }
    }
}