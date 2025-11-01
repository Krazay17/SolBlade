import { io } from "../../server.js";
import SvActor from "./SvActor.js";

export default class SvPower extends SvActor {
    touch(data) {
        if (!this.active) return;
        const actor = this.actorManager.getActorById(data.netId);
        switch (this.data.power) {
            case 'health':
                actor.healthC?.add(25);
                break;
            case 'energy':
                actor.energy?.add(50);
                break;
        }
        //this.die();
        io.emit('actorEvent', { id: this.netId, event: 'applyTouch', data });
    }
    die() {
        super.die();
        this.respawn(10000)
    }
}