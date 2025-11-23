import { io } from "socket.io-client"
import GameServer from "../../server/core/GameServer";

export default class NetManager {
    constructor() {
        this.localServer = null;
        this.serverVersion = null;
        this.remote = false;
        this.serverURL = location.hostname === "localhost"
            ? "localhost:8080"
            : "srv.solblade.online";

            this.eventHandlers = {
                playerJoined: (data)=>{
                    console.log("player joined", data);
                },
                stateUpdate: (data)=>{
                    console.log("state update", data);
                }
            }

        this.ready = this.init();
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

    bindEvents(){
        for (const [event, handler] of Object.entries(this.eventHandlers)){
            this.on(event, handler);
        }
    }
}