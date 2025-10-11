import MyEventEmitter from "../core/MyEventEmitter";
import Pickup from "./Pickup";

export default class CrownPickup extends Pickup {
    constructor(scene, data) {
        super(scene, data);
        this.makeMesh('crown', .6);
    }
    applyCollect() {
        MyEventEmitter.emit('pickupCrown');
    }
}