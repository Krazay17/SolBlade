import { Actor } from "@solblade/common/actors/Actor.js";
import { spawnA } from "@solblade/common/core/AFactory";
import SolWorld from "@solblade/common/core/SolWorld.js";
import AIController from "./AIController";

export class SWorld extends SolWorld {
    constructor(name) {
        super(name);
        this.actorIndex = 2;
    }
    async start() {
        await this.physics.makeWorld(this.name);
        const enemies = 1;
        for (let i = 0; i < enemies; i++) {
            const actor = spawnA(this, "wizard", "server", { id: this.actorIndex++, pos: [0, 1, -5] });
            this.actors.set(actor.id, actor);
            actor.add(new AIController(actor, this));
        }
    }
    addPlayer(id, data) {
        const actor = spawnA(this, data.type, "server", data);
        actor.id = id;
        this.actors.set(id, actor);
        this.players.set(id, actor);

        return actor;
    }
    removePlayer(id) {
        const player = this.players.get(id);
        if (!player) return;
        this.players.delete(id);
        this.actors.delete(id);
    }
    step(dt) {
        this.physics.step(dt);
        const update = {}
        update.state = this.getState();
        update.players = [...this.players.keys()];
        return update;
    }
}