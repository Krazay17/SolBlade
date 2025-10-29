import SvActor from "./SvActor.js";

export default class SvPower extends SvActor {
    touch(data) {
        if (!this.active) return;
        const actor = this.actorManager.getActorById(data.dealer);
        switch (this.data.power) {
            case 'health':
                actor.healthC.add(25);
                break;
            case 'energy':
                actor.energy.add(50);
                break;
        }
        this.die();
    }
    die() {
        super.die();
        this.respawn(5000)
    }
}