import { SOL_PHYSICS_SETTINGS } from "@solblade/common/config/SolConstants.js"
import WorldManager from "./WorldManager.js";
import ServerEvents from "@solblade/server/core/ServerEvents.js";

export default class GameServer {
    constructor(transport) {
        this.transport = transport;
        
        this.worldManager = new WorldManager(this);
        
        this.netEvents = new ServerEvents(this, transport);
        this.running = true;
    }
    init() {
        const dt = SOL_PHYSICS_SETTINGS.serverTick * 1000;
        this.fixedUpdateTimer = setInterval(() => {
            if (this.running) {
                this.step(dt);
            }
        }, dt);
    }
    step(dt) {
        if (this.worldManager) this.worldManager.step(dt);
    }
}