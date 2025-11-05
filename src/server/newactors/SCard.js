import { makeRandomItem } from "@solblade/shared";
import SActor from "./SActor.js";

export default class SCard extends SActor {
    constructor(game, data) {
        super(game, {
            ...data,
            itemData: data.itemData ?? makeRandomItem()
        })
        this.auth = true;
        this.onDeactivate = () => this.respawn({ respawnTime: 1000 })
    }
    update(dt) {
        this.rotY += dt;
    }
    touch(dealer) {
        this.deActivate()
    }
    hit(){
        this.deActivate();
    }
}