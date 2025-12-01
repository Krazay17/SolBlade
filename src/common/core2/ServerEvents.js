import { NETPROTO } from "../core/NetProtocols";

export class ServerEvents {
    constructor(server, io) {
        this.server = server;
        this.io = io
        this.events = {};
    }
    bindEvents() {
        for (const p of Object.values(NETPROTO)) {
            const f = this[p];
            if (typeof f === "function") {
                this.on(p, f);
            } else {
                console.warn(`No function ${p}`);
            }
        }
    }
    on(event, handler) {
        this.events[event] = handler;
    }
    playerJoined(id, data) {
        const {worldName} = data;
        this.server.worlds[worldName].addPlayer(id, data);
    }
}