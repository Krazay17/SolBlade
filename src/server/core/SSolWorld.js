import { GameLogic } from "@solblade/common/core/GameLogic.js";
import { NETPROTO } from "@solblade/common/core/NetProtocols";
import SolWorld from "@solblade/common/core/SolWorld.js";
import { SActorManager } from "./SActorManager";

export class SSolWorld extends SolWorld {
    /**
     * 
     * @param {GameLogic} game 
     * @param {String} name 
     */
    constructor(game, name) {
        super(name);
        this.game = game;
        this.actorManager = new SActorManager(game, this);
    }
    async enter(){
        super.enter();
        
        //test enemy spawn before I use glb locations
        const enemies = 1;
        for (let i = 0; i < enemies; i++) {
            this.actorManager.newActor('enemy', { subtype: "wizard", pos: [0, 20, i] });
        }
    }
    step(dt) {
        super.step(dt);

        this.timeSinceLastUpdate = (this.timeSinceLastUpdate || 0) + dt;
        if (this.timeSinceLastUpdate >= 0.1) {
            this.timeSinceLastUpdate = 0;

            const actorArray = arrayBuffer(filterMoved(this.actorManager.allActors))
            this.broadcastWorldState(actorArray.buffer)
        }
    }
    broadcastWorldState(state) {
        const players = [...this.actorManager.actors.players.keys()];

        this.game.broadcast(NETPROTO.WORLD_UPDATE, { world: this.name, state, players })
    }
}

function arrayBuffer(list, length = 8) {
    const count = list.length;
    const buffer = new Float32Array(count * length)
    let i = 0;
    for (const e of list) {
        buffer[i++] = e.id ?? 0;
        buffer[i++] = e.pos[0] ?? 0;
        buffer[i++] = e.pos[1] ?? 0;
        buffer[i++] = e.pos[2] ?? 0;
        buffer[i++] = e.rot[0] ?? 0;
        buffer[i++] = e.rot[1] ?? 0;
        buffer[i++] = e.rot[2] ?? 0;
        buffer[i++] = e.rot[3] ?? 0;
    };
    return buffer;
}

function filterMoved(actors) {
    return actors.filter(a => {
        if (!a.active) return false;
        const moved = (
            !a.lastPos ||
            a.pos[0] !== a.lastPos[0] ||
            a.pos[1] !== a.lastPos[1] ||
            a.pos[2] !== a.lastPos[2]
        );
        const rotated = (
            !a.lastRot ||
            a.rot[0] !== a.lastRot[0] ||
            a.rot[1] !== a.lastRot[1] ||
            a.rot[2] !== a.lastRot[2] ||
            a.rot[3] !== a.lastRot[3]
        );
        if (moved || rotated) {
            a.lastPos = [a.pos[0], a.pos[1], a.pos[2]];
            a.lastRot = [a.rot[0], a.rot[1], a.rot[2], a.rot[3]];
            return true;
        }
        return false;
    })
}