import GameClient from "@solblade/client/core/GameClient";
import { NETPROTO } from "@solblade/common/core/NetProtocols";

export default class ClientEvents {
    /**
     * 
     * @param {GameClient} game 
     */
    constructor(game, transport) {
        this.game = game;
        this.transport = transport;
        this.bindWorldEvents();
        this.bindNetEvents();
    }
    bindWorldEvents(){

    }
    bindNetEvents() {
        for (const event of Object.values(NETPROTO)) {
            if (typeof this[event] === "function") {
                this.transport.on(event, (data) => this[event](data))
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
    spawnActor(actor){
        const existingActor = this.game.solWorld.actorManager.getActorById(actor.id);
        if(existingActor) {
            existingActor.activate();
        }
    }
    worldUpdate(data){

    }
}