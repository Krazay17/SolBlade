import { netSocket } from "../core/NetManager";
import Pickup from "./Pickup";

export default class CrownPickup extends Pickup {
    constructor(scene, data) {
        super(scene, data);
        this.makeMesh('crown', .6);
    }
    hit(){}
    applyTouch(data) {
        super.applyTouch(data);
        netSocket.emit('crownPickup', data.dealer.netId);
    }
}