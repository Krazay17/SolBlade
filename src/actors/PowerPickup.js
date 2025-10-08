import Pickup from "./Pickup";
import * as THREE from 'three';

export default class PowerPickup extends Pickup {
    constructor(scene, pos, type, netId) {
        super(scene, pos, netId);
        this.type = type;
        this.color = null;
        switch (this.type) {
            case 'energy':
                this.color = 0xffff00;
                break;
            case 'health':
                this.color = 0x00ff00;
                break;
            default:
                this.color = 0xffffff;
                break;
        }
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshBasicMaterial({ color: this.color })
        );
        this.add(mesh);
    }
    applyCollect(player) {
        switch (this.type) {
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