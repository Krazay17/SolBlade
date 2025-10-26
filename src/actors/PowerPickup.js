import Pickup from "./Pickup";
import * as THREE from 'three';

export default class PowerPickup extends Pickup {
    constructor(scene, data) {
        data.health = 10;
        super(scene, data);

        let color;
        switch (data.power) {
            case 'health':
                color = 0x00ff00;
                break;
            case 'energy':
                color = 0xffff00;
                break;
            default:
                color = 0xffffff;
        }
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshBasicMaterial({ color })
        );
        this.add(mesh);
    }
    touch(dealer) {
        super.touch(dealer);
        this.active = false;
    }
    applyTouch(data) {
        const { dealer, target } = data;
        if (dealer === this.game.player) {
            switch (this.data.power) {
                case 'health':
                    dealer.health += 25;
                    break;
                case 'energy':
                    dealer.energy.add(50);
                    break;
            }
        }
        super.applyTouch(data);
    }
}