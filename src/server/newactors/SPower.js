import SActor from "./SActor.js";

export default class SPower extends SActor {
    touch(data) {
        if (!this.active) return;
        data = this.game.actorManager.getActorById(data);
        switch (this.data.power) {
            case "energy":
                data.energy.add(50);
                break;
            case "health":
                data.health.add(25);
                break;
            default: console.log('no power type!');
        }

        this.deActivate();
    }
    deActivate() {
        super.deActivate();
        
        this.respawn();
    }
}