import GameClient from "@solblade/client/core/GameClient.js";
import { NETPROTO } from "@solblade/common/core/NetProtocols.js";
import { NetworkManager } from "./NetworkManager.js";

export default class ClientEvents {
    /**
     * 
     * @param {GameClient} game 
     * @param {NetworkManager} net
     */
    constructor(game, net) {
        this.game = game;
        this.net = net;
        this.bindEvents();
    }
    bindEvents() {
        for (const event of Object.values(NETPROTO)) {
            if (typeof this[event] === "function") {
                this.net.on(event, (data) => this[event](data))
            } else {
                console.warn(`[Client Events] No handler method ${event}`);
            }
        }
    }
    playerJoined(data) {
        console.log('local call: player joined', data);
    }
    stateUpdate(data) {
        console.log("state update", data);
    }
    spawnActor(actor) {
        const am = this.game.world.actorManager;
        const existingActor = am.getActorById(actor.id);
        if (existingActor) {
            existingActor.activate();
        } else {
            am.newActor(actor.type, actor, true);
        }
    }
    worldUpdate(data) {
        const am = this.game.world.actorManager
        const view = new Float32Array(data);
        for (let i = 0; i < view.length; i += 8) {
            const actor = am.getActorById(view[i]);
            if (!actor || !actor.isRemote) continue;
            actor.pos = [view[i + 1], view[i + 2], view[i + 3]];
            actor.rot = [view[i + 4], view[i + 5], view[i + 6], view[i + 7]];
        }
    }
}