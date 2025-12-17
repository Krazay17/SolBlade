import { Actor } from "@solblade/common/actors/Actor.js";
import { Debugger } from "@solblade/common/actors/components/Debugger";
import { spawnA } from "@solblade/common/core/AFactory";
import SolWorld from "@solblade/common/core/SolWorld.js";

export class SWorld extends SolWorld {
    constructor(name) {
        super(name);
        this.actorIndex = 2;
    }
    async start() {
        await this.physics.makeWorld(this.name);
        const enemies = 1;
        for (let i = 0; i < enemies; i++) {
            const actor = spawnA(this, "wizard", "server", { pos: [0, 40 + i, -5] });
        }
        const spawnBox = () => {
            if (this.actors.size < 50) spawnA(this, "box", "server", { pos: [0, 155, 0] });
            setTimeout(spawnBox, 2500);
        }
        spawnBox();
    }
    addActor(actor, id) {
        id = id
            ? id
            : this.actorIndex++;

        actor.id = id;
        this.actors.set(id, actor);
    }
    removeActor(id) {
        const actor = this.actors.get(id);
        if (!actor) return;
        if (actor.collider) this.physics.world.removeCollider(actor.collider);
        actor.destroy();
        this.actors.delete(id);
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
        this.actors.forEach((v, k) => {
            if (v.pos[1] < -100) this.removeActor(k);
        })
        this.physics.step(dt);
        const update = {}
        update.state = this.getState();
        update.players = [...this.players.keys()];
        return update;
    }
}