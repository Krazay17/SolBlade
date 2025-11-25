import { SOL_PHYSICS_SETTINGS } from "@solblade/common/config/SolConstants.js"
import WorldManager from "../managers/WorldManager.js";
import SNetEvents from "@solblade/server/core/SNetEvents.js";

export default class GameServer {
    constructor(transport) {
        this.transport = transport;
        this.netEvents = new SNetEvents(this, transport);

        this.worldManager = new WorldManager(this);

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