import SolWorld from "@solblade/common/core/SolWorld.js";

export class SWorld extends SolWorld {
    async start() {
        await this.physics.makeWorld(this.name);
        this.gameState
    }
    addPlayer(id, data) {
        this.gameState.actors.set(id, data);
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