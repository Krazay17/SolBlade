import MyEventEmitter from "../core/MyEventEmitter";
import Pickup from "./Pickup";

export default class CrownPickup extends Pickup {
    constructor(scene, data) {
        super(scene, data);
        this.makeMesh('crown', .6);
    }
    hit() { }
    applyTouch(data) {
        super.applyTouch(data);
        if (data.dealer === this.game.player) {
            MyEventEmitter.emit('crownPickup');
        }
    }
}