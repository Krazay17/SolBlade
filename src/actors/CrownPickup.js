import Pickup from "./Pickup";

export default class CrownPickup extends Pickup {
    constructor(scene, pos, itemId) {
        super(scene, 'crown', pos, itemId);

        this.createPickupMesh(0.6);
    }
}