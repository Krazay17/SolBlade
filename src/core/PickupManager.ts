import CrownPickup from "../actors/CrownPickup";
import ItemPickup from "../actors/ItemPickup";
import Pickup from "../actors/Pickup";
import PowerPickup from "../actors/PowerPickup";
import Player from "../player/Player";
import GameScene from "../scenes/GameScene";

export default class PickupManager {
    scene: GameScene;
    player: Player;
    pickups: Pickup[] | null = [];
    pickupRadius: number = 1.75;
    constructor(scene: GameScene, player: Player) {
        this.scene = scene;
        this.player = player;
    }
    update(dt: number) {
        if (!this.pickups) return;
        if (this.pickups.length < 1) return;
        const playerPos = this.player.position;

        for (const pickup of this.pickups) {
            const dist = playerPos.distanceTo(pickup.position);
            if (dist < this.pickupRadius) {
                pickup.onCollect(this.player);
            }
        }
    }
    spawnPickup(type: string, pos: any, item: any, netId: string) {
        let pickup: Pickup | null = null;
        switch (type) {
            case 'item':
                pickup = new ItemPickup(this.scene, pos, item, null, netId);
                break;
            case 'crown':
                pickup = new CrownPickup(this.scene, pos, netId);
                break;
            case 'health':
                pickup = new PowerPickup(this.scene, pos, type, netId);
                break;
            case 'energy':
                pickup = new PowerPickup(this.scene, pos, type, netId);
                break;
            default:
                console.warn(`PickupManager.spawnPickup no case of type ${type}`);
        }
        if (pickup) {
            this.pickups?.push(pickup);
        }
    }
    removePickup(item: any, netId: string) {
        item = item ? item : this.pickups?.find(p => p.netId === netId);
        if (item) {
            this.scene.graphics.remove(item);
            this.pickups?.splice(this.pickups.indexOf(item), 1);
        }
    }
    getPickup(netId: string) {
        return this.pickups?.find(p => p.netId === netId);
    }
}