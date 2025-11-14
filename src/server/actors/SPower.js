import { randomPos } from "@solblade/shared";
import SActor from "./SActor.js";

export default class SPower extends SActor {
    touch(data) {
        if (!this.active) return;
        const actor = this.game.actorManager.getActorById(data);
        if (!actor) return;
        switch (this.data.power) {
            case "energy":
                actor.energy.add(50);
                break;
            case "health":
                actor.health.add(25);
                break;
            default: console.log('no power type!');
        }

        this.deActivate();
    }
    hit(){
        this.deActivate();
    }
    activate() {
        this.pos = randomPos(20, 10);
        super.activate()
    }
}