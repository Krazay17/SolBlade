import { io } from "../../server.js";
import { makeRandomItem, makeItem } from "../Item.js";
import SvActor from "./SvActor.js";

export default class SvCard extends SvActor {
    constructor(a, data) {
        data.maxHealth = 100;
        data.doesRespawn = data.doesRespawn ?? true;
        if (data.item) data.item = data.item;
        else if (data.itemType) data.item = makeItem(data.itemType);
        else data.item = makeRandomItem()
        super(a, data)
    }
    touch(data) {
        if (!this.active) return;
        io.emit('actorTouch', { id: this.netId, data });
        this.die();
    }
    die() {
        super.die();
        if (this.data.doesRespawn) {
            this.respawn(10000);
        }
    }
}