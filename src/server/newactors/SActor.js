import { Actor } from "@solblade/shared";
import SvActorManager from "../SvActorManager.js";
import { io } from "../server.js";

export default class SActor extends Actor {
    constructor(actorManager, data) {
        super(data)
        /**@type { SvActorManager} */
        this.actorManager = actorManager;

        this.init();
    }
    destroy() {
        super.destroy();
    }
    hit(data) {
        io.emit('actorEvent', {id: this.netId, event: "applyHit", data});
        this.destroy();
    }
}