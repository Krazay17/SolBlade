import GameServer from "@solblade/common/core/GameLogic.js";
import { NETPROTO } from "@solblade/common/core/NetProtocols.js";

export default class ServerEvents {
    /**
     * 
     * @param {GameServer} game 
     */
    constructor(game) {
        this.game = game;
        this.bindWorldEvents();
        this.bindNetEvents();
    }
    bindWorldEvents() {
        const worlds = this.game.worldManager.worlds;
        for (const w of Object.values(worlds)) {
            w.actorManager.onNewActor = (actor) => {
                this.game.emit(NETPROTO.SPAWN_ACTOR, {
                    worldName: w.name,
                    id: actor.id,
                    type: actor.type,
                    subtype: actor.subtype,
                    pos: actor.pos,
                })
            }
            w.onStep = (buffer) => {
                this.game.emit(NETPROTO.WORLD_UPDATE, buffer);
            }
        }
    }
    bindNetEvents() {
        for (const event of Object.values(NETPROTO)) {
            if (typeof this[event] === "function") {
                this.game.on(event, (data) => this[event](data))
            } else {
                console.warn(`[Server Events] No handler method ${event}`);
            }
        }
    }
    playerJoined(data) {
        console.log('player joined', data);
        this.game.emit(NETPROTO.PLAYER_JOINED, data);
    }
    stateUpdate(data) {
        console.log('state update', data);
    }
    spawnActor(data) {
        this.game.worldManager.worlds[data.worldName].actorManager.newActor(data.type, data);
        this.game.emit(NETPROTO.SPAWN_ACTOR, data.serialize());
    }
}