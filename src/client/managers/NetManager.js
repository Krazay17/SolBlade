import { io } from "socket.io-client"
import GameServer from "../../server/core/GameServer";

export default class NetManager {
    constructor() {
        this.localServer = null;
        this.remote = false;
        this.ready = false;
        this.serverVersion = null;

        this.serverURL = location.hostname === "localhost"
            ? "localhost:8080"
            : "srv.solblade.online";

        this.init();
    }
    async init() {
        try {
            this.socket = io(this.serverURL, {
                transports: ["websocket"],
                reconnection: false,
                timeout: 1000,
            });
            const result = await this.socket.timeout(1000).emitWithAck("hello");
            this.serverVersion = result;
            this.remote = true;

            console.log(`Connected ID: ${this.socket.id}`, result);
        } catch (err) {
            console.log('net init fail', err);
            this.localServer = new GameServer(this);
            this.remote = false;
        }
    }
    emit(event, data) {
        if (this.remote) this.socket.emit(event, data);
        else this.localServer?.handleEvent?.(event, data);
    }

    on(event, callback) {
        if (this.remote) this.socket.on(event, callback);
        else this.localServer?.registerEvent?.(event, callback);
    }
}