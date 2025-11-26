import { io } from "socket.io-client"
import GameServer from "@solblade/server/core/GameServer";

export default class CNetManager {
    constructor() {
        this.localServer = null;
        this.serverVersion = null;
        this.transport = null;
        this.remote = false;
        this.serverURL = location.hostname === "localhost"
            ? "https://localhost:8080"
            : "https://srv.solblade.online";

        this.ready = this.init();
    }
    async init() {
        try {
            this.socket = io(this.serverURL, {
                transports: ["websocket"],
                reconnection: false,
                timeout: 1,
            });
            const result = await this.socket.timeout(1).emitWithAck("hello");
            this.serverVersion = result;
            this.transport = this.socket;
            this.remote = true;

            console.log(`Connected ID: ${this.socket.id}`, result);
        } catch (err) {
            console.log('net init fail', err);
            const client = new ClientTransport();
            const server = new LocalServerTransport(client)
            this.localServer = new GameServer(server);
            

            this.transport = client;
        }
    }
    on(e, h) { this.transport.on(e, h) }
    emit(e, d) { this.transport.emit(e, d) }
}

class ClientTransport {
    constructor() {
        this.server = null;
        this.handlers = {};
    }
    on(event, handler) {
        this.handlers[event] = handler;
    }
    emit(event, data) {
        this.server.receive(event, data);
    }
    _serverSend(e, d) {
        const h = this.handlers[e];
        if (h) h(d)
    }
}
class LocalServerTransport {
    constructor(client) {
        this.client = client;
        this.client.server = this;
        this.handlers = {};
    }
    emit(event, data) {
        this.client._serverSend(event, data);
    }
    on(event, handler) {
        this.handlers[event] = handler;
    }
    // called by client
    receive(event, data) {
        this.handlers[event]?.(data);
    }
}