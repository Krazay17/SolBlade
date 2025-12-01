import { io } from "socket.io-client";
import { SGame } from "./SGame";
import { CGame } from "./CGame";
import { NETPROTO } from "../core/NetProtocols";

export class CNet {
    /**
     * 
     * @param {String} url 
     * @param {CGame} game 
     */
    constructor(url, game) {
        this.url = url;
        this.game = game;

        this.socket = null;
        this.localServer = null;
    }
    async start() {
        try {
            this.socket = await this._tryConnect();
        }
        catch {
            const client = new LocalClientIO()
            const server = new LocalServerIO(client);
            this.socket = client;
            this.localServer = new SGame(server);
            await this.localServer.start(false);
        }
        this.bindings();
    }
    sendUserCommand(userCommand) {
        if (this.socket) {

            this.socket.emit("userCommand", userCommand);
        }
    }
    _tryConnect() {
        return new Promise((resolve, reject) => {
            const tempSocket = io(this.url, {
                transports: ["websocket"],
                reconnection: false,
                timeout: 100,
            });

            tempSocket.on("connect", () => {
                resolve(tempSocket);
            });
            tempSocket.on("connect_error", (err) => {
                reject(err);
            });
        });
    }
    bindings() {
        for (const p of Object.values(NETPROTO.CLIENT)) {
            const h = this.game[p];
            if (typeof h === "function") {
                this.socket.on(p, h.bind(this.game));
            } else console.warn(`No function ${p}`);
        }
    }
}
class LocalClientIO {
    constructor() {
        this.server = null;
        this.handlers = {};
    }
    on(event, handler) {
        this.handlers[event] = handler;
    }
    emit(event, data) {
        this.server.recieve(event, data);
    }
    receive(event, data) {
        const h = this.handlers[event];
        if (h) h(data);
    }
}
class LocalServerIO {
    /**
     * @param {LocalClientIO}client
     */
    constructor(client) {
        this.client = client;
        client.server = this;
        this.handlers = {};
    }
    on(event, handler) {
        this.handlers[event] = handler;
    }
    emit(event, data) {
        this.client.receive(event, data);
    }
    receive(event, data) {
        const h = this.handlers[event];
        if (h) h(data);
    }
}