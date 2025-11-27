import { SOL_PHYSICS_SETTINGS } from "@solblade/common/config/SolConstants.js"
import WorldManager from "./WorldManager.js";

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
    }
    step(dt) {
        if (this.worldManager) this.worldManager.step(dt);
        this.tickCounter++;
        this.broadcast('gameStateUpdate', {
            mode: 'Local',
            serverTicks: this.tickCounter
        })
    }
    addPlayer(id){

    }
    removePlayer(id){

    }
    handleClientInput(id, event, data){

    }
    handlePlayerShoot(data) {
        this.broadcast('playerShotFired', { id: "player", target: data.target });
    }
}