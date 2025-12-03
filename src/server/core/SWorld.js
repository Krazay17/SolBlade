import Wizard from "@solblade/common/actors/Wizard";
import SolWorld from "@solblade/common/core/SolWorld.js";

export class SWorld extends SolWorld {
    constructor(name) {
        super(name);
        this.actorIndex = 2;
    }
    async start() {
        await this.physics.makeWorld(this.name);

        this.newActor(new Wizard(this, { id: this.actorIndex++, pos: [0, 10, 0] }));
    }
    addPlayer(id, data) {
        this.players.set(id, data);
    }
    step(dt) {
        this.physics.step(dt);
        const update = {}
        update.state = this.getState();
        update.players = [...this.players.keys()];
        return update;
    }
}