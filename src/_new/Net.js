import { io } from "socket.io-client"
import LocalGame from "./LocalGame";

export default class Net {
    constructor() {
        this.localServer = null;
        this.remote = false;
        this.ready = false;

        this.serverURL = location.hostname === "localhost"
            ? "localhost:8080"
            : "srv.solblade.online";

       //this.init();
    }
    async init() {
        try {
            this.socket = io(this.serverURL, {
                transports: ["websocket"],
                reconnection: true,
                timeout: 5000,
            });
            const response = await
                this.socket.timeout(5000).emitWithAck("hello");
            this.remote = true;
        } catch {
            this.localServer = new LocalGame()
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




