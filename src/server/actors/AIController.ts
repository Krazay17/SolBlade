
import { Actor } from "@solblade/common/actors/Actor";
import { Controller } from "@solblade/common/actors/components/Controller";
import SolWorld from "@solblade/common/core/SolWorld";
import { Vector3 } from "three";

interface Blackboard {
    player?: Actor;
    dir?: Vector3;
}

export class AIController extends Controller {
    aggroRadius: number;
    blackboard: Blackboard;

    tempVec = new Vector3();
    constructor(actor: Actor, world: SolWorld, data?: any) {
        super(actor, world);
        this.actor = actor;
        this.world = world;
        const {
            aggroRadius = 50
        } = data;
        this.aggroRadius = aggroRadius;

        this.blackboard = {
            player: null,
            dir: this.tempVec,
        };
    }
    tick(dt) {
        this.findNearestPlayer();
        if (this.blackboard.player) {
            this.actor.fsm?.setState('chase');
        } else {
            this.actor.fsm?.setState('patrol');
        }
    }
    inputDirection() {
        const dir = this.blackboard.player
            ? this.blackboard.dir
            : this.actor.vecRot;
        return dir;
    }
    findNearestPlayer() {
        const players = this.world.players
        if (!players) {
            this.blackboard.player = null;
            return;
        };

        const pos = this.actor.vecPos;

        // find nearest player
        let nearest = null;
        let minDistSq = Infinity;
        let targetDir = null;
        for (const [id, p] of players) {
            const dx = p.pos[0] - pos.x;
            const dy = p.pos[1] - pos.y;
            const dz = p.pos[2] - pos.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < this.aggroRadius && (distSq < minDistSq)) {
                minDistSq = distSq;
                nearest = p;
                targetDir = { x: dx, y: dy, z: dz };
            }
        }
        if (!nearest) {
            this.blackboard.player = null;
            return;
        }

        const dist = Math.sqrt(minDistSq);
        const dir = {
            x: targetDir.x / dist,
            y: targetDir.y / dist,
            z: targetDir.z / dist,
        }
        this.blackboard.player = nearest;
        this.blackboard.dir = this.tempVec.copy(dir);
    }
} 