import { NETPROTO } from "@common/net/NetProtocols";

export default class NetEvents {
    constructor(game, transport) {
        this.game = game;
        this.transport = transport;

        this.eventHandlers = {
            [NETPROTO.PLAYER_JOINED]: (data) => {
                console.log("player joined", data);
            },
            stateUpdate: (data) => {
                console.log("state update", data);
            }
        }

        this.bindEvents();
    }
    bindEvents() {
        for (const [event, handler] of Object.entries(this.eventHandlers)) {
            this.transport.on(event, handler.bind(this));
        }
    }
}