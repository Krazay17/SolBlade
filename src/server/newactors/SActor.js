import { Actor, randomPos } from "@solblade/shared";
import SvActorManager from "../SvActorManager.js";
import { io } from "../server.js";

export default class SActor extends Actor {
    constructor(actorManager, data) {
        super(data)
        /**@type { SvActorManager} */
        this.actorManager = actorManager;

        this.init();
    }
    activate(data = {}) {
        super.activate(data)
        io.emit('newActor', this.serialize());
    }
    deActivate() {
        if(!this.active) return;
        super.deActivate();
        io.emit('actorEvent', {id:this.netId, event: 'deactivate'});
    }
    hit(data) {
        if(!this.active)return;
        this.deActivate();
        io.emit('actorEvent', { id: this.netId, event: "applyHit", data });
    }
    respawn(data = {}) {
        const {
            respawnTime = 1000,
            pos = randomPos(20, 10),
        } = data;
        setTimeout(() => {
            this.activate({ ...data, pos })
        }, respawnTime)
    }
}