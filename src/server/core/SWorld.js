import { GameState } from "@solblade/common/good/GameState.js"
import { Physics } from "@solblade/common/good/Physics.js"

export class SWorld {
    /**
     * 
     * @param {String} name 
     */
    constructor(name) {
        this.name = name;

        this.gameState = new GameState();
        this.physics = new Physics(this.gameState);
    }
    async start() {
        await this.physics.makeWorld(this.name);
    }
    addPlayer(id, data) {
        this.gameState.players.set(id, data);
    }
    step(dt) {
        this.physics.step(dt);
        const update = {}
        update.state = this.gameState.getState();
        update.players = [...this.gameState.players.keys()];
        return update;
    }
}