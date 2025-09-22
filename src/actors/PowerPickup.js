import Pickup from "./Pickup";

export default class PowerPickup extends Pickup {
    constructor(scene, type, pos, itemId) {
        super(scene, type, pos, itemId);
        this.createPickupMesh();
    }
}