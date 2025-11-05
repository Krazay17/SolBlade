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
        console.log(this.data.itemData)
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
        this.data.itemData = makeRandomItem();
        super.activate()
    }
    deActivate() {
        this.pos = randomPos(20, 10);
        this.respawn(1000)

        super.deActivate();
    }
}