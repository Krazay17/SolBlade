import { SOL_PHYSICS_SETTINGS } from "@solblade/common/config/SolConstants.js"
import WorldManager from "./WorldManager.js";
import { NETPROTO } from "./NetProtocols.js";

export class GameLogic {
    constructor(broadcaster) {
        this.broadcast = broadcaster;
        this.worldManager = new WorldManager(this);
        this.running = true;
        this.tickCounter = 0;
    }
    async start() {
        await this.worldManager.start();
        const dt = SOL_PHYSICS_SETTINGS.serverTick * 1000;
        this.fixedUpdateTimer = setInterval(() => {
            if (this.running) {
                this.step(dt);
            }
        }, dt);
        for (const event of Object.values(NETPROTO)) {
            if (typeof this[event] === "function") {
                this.broadcast.on(event, (data) => this[event](data))
            } else {
                console.warn(`[Server Events] No handler method ${event}`);
            }
        }
    }
    step(dt) {
        if (this.worldManager) this.worldManager.step(dt);
    }
    addPlayer(id) {

    }
    removePlayer(id) {

    }
    handleClientInput(id, event, data) {

    }
    handlePlayerShoot(data) {
        this.broadcast('playerShotFired', { id: "player", target: data.target });
    }
}