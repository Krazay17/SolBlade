import Actor from "@solblade/common/actors/Actor.js";
import SolWorld from "@solblade/common/core/SolWorld.js";

export class SWorld extends SolWorld {
    constructor(name) {
        super(name);
        this.actorIndex = 2;
    }
    async start() {
        await this.physics.makeWorld(this.name);
    }
    addPlayer(id, data) {
        this.players.set(id, data);
        this.newActor(new Actor(data));
    }
    step(dt) {
        this.physics.step(dt);
        const update = {}
        update.state = this.getState();
        update.players = [...this.players.keys()];
        return update;
    }
}