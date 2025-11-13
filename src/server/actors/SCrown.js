import SActor from "./SActor.js";

export default class SCrown extends SActor {
    hit() { }
    touch(dealer) {
        this.deActivate();
        if (this.quest) this.quest.pickupCrown(dealer);
    }
}