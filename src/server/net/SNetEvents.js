import GameServer from "@server/core/GameServer";
import { NETPROTO } from "@common/net/NetProtocols";

export default class SNetEvents {
    /**
     * 
     * @param {GameServer} game 
     */
    constructor(game, transport) {
        this.game = game;
        this.transport = transport;

        this.eventHandlers = {
            [NETPROTO.PLAYER_JOINED]: (data) => this.playerJoined(data),
            [NETPROTO.STATE_UPDATE]: (data) => this.stateUpdate(data),
            [NETPROTO.SPAWN_ACTOR]: (data)=> this.spawnActor(data),
        }
        this.bindEvents();
    }
    bindEvents() {
        for (const [event, handler] of Object.entries(this.eventHandlers)) {
            this.transport.on(event, handler);
        }
    }
    playerJoined(data) {
        console.log('player joined', data);
        console.log(this.game.worldManager.worlds.world1)
    }
    stateUpdate(data) {
        console.log('state update', data);
    }
    spawnActor(data){
        this.game.worldManager.worlds[data.worldName].actorManager.addActor(data.type, data);
        this.transport.emit(NETPROTO.SPAWN_ACTOR, data);
    }
}