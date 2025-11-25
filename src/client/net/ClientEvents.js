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

        this.eventHandlers = {
            [NETPROTO.PLAYER_JOINED]: (data) => this.playerJoined(data),
            [NETPROTO.STATE_UPDATE]: (data) => this.stateUpdate(data)
        }
        this.bindEvents();
    }
    bindEvents() {
        for (const [event, handler] of Object.entries(this.eventHandlers)) {
            this.transport.on(event, handler);
        }
    }
    playerJoined(data) {
        console.log('local call: player joined', data);
    }
    stateUpdate(data) {
        console.log("state update", data)
    }
}