import GameServer from "@solblade/server/core/GameServer.js";
import { NETPROTO } from "@solblade/common/core/NetProtocols.js";

export default class ServerEvents {
    /**
     * 
     * @param {GameServer} game 
     */
    constructor(game, transport) {
        this.game = game;
        this.transport = transport;
        this.bindWorldEvents();
        this.bindNetEvents();
    }
    bindWorldEvents() {
        const worlds = this.game.worldManager.worlds;
        for (const w of Object.values(worlds)) {
            w.actorManager.onNewActor = (actor) => {
                this.transport.emit(NETPROTO.SPAWN_ACTOR, {
                    worldName: w.name,
                    id: actor.id,
                    type: actor.type,
                    subtype: actor.subtype,
                    pos: actor.pos,
                })
            }
        }
    }
    bindNetEvents() {
        for (const event of Object.values(NETPROTO)) {
            if (typeof this[event] === "function") {
                this.transport.on(event, (data) => this[event](data))
            } else {
                console.warn(`[Server Events] No handler method ${event}`);
            }
        }

    }
    playerJoined(data) {
        console.log('player joined', data);
        console.log(this.game.worldManager.worlds.world1)
        this.transport.emit(NETPROTO.PLAYER_JOINED, data);
    }
    stateUpdate(data) {
        console.log('state update', data);
    }
    spawnActor(data) {
        this.game.worldManager.worlds[data.worldName].actorManager.addActor(data.type, data);
        this.transport.emit(NETPROTO.SPAWN_ACTOR, data);
    }
}