import { makeRandomItem, randomPos } from "@solblade/shared";
import SActor from "./SActor.js";
import { io } from "../SMain.js";

export default class SCard extends SActor {
    constructor(game, data) {
        super(game, {
            ...data,
            itemData: data.itemData ?? makeRandomItem()
        })
        this.auth = true;
    }
    update(dt) {
        this.rotY += dt;
    }
    touch(dealer) {
        this.deActivate()
        io.to(dealer).emit('addCard', this.data.itemData);
    }
    hit() {
        this.deActivate();
    }
    activate() {
        super.activate()
    }
    deActivate() {
        this.data.itemData = makeRandomItem();
        this.pos = randomPos(20, 10);
        super.deActivate();
        this.respawn(1000)
    }
}