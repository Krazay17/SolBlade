import GameServer from "@server/core/GameServer";

export default class SNetEvents {
    /**
     * 
     * @param {GameServer} game 
     */
    constructor(game, transport) {
        this.game = game;
        this.transport = transport;

        this.eventHandlers = {
            playerJoined: (data) => {
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
            this.transport.on(event, handler);
        }
    }

}