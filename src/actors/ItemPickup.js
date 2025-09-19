import ItemManager from "../core/ItemManager";
import Pickup from "./Pickup";

export default class ItemPickup extends Pickup {
    constructor(scene, pos, itemId, itemData) {
        super(scene, 'item', pos, itemId);
        this.itemManager = new ItemManager();
        this.itemData = itemData || this.itemManager.makeRandomItem();
    }

    applyCollect(player) {
        player.inventory.addItem(this.itemData);
    }
}