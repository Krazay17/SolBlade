
import Controller from "@solblade/common/actors/components/Controller";
import { Pawn } from "@solblade/common/actors/Pawn";

export default class AIController extends Controller {
    pawn: Pawn;
    aggroRadius: number;
    blackboard: any;
    constructor(pawn: Pawn, data: any = {}) {
        super();
        this.pawn = pawn;
        const {
            aggroRadius = 20
        } = data;
        this.aggroRadius = aggroRadius;

        this.blackboard = {};
    }
    update(dt) {
        this.blackboard = this.findNearestPlayer();
        if (!this.blackboard.player) {
            this.pawn.fsm.setState('patrol');
        }
    }
    inputDirection() {
        return this.blackboard.dir;
    }
    findNearestPlayer() {
        const players = this.pawn.world.players
        if (!players) return {};

        // get this enemy's position
        if(!this.pawn.movement)return;
        const pos = this.pawn.movement.vecPos

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
        if (!nearest) return false;

        const dist = Math.sqrt(minDistSq);
        const dir = {
            x: targetDir.x / dist,
            y: targetDir.y / dist,
            z: targetDir.z / dist,
        }
        return { player: nearest, dist, dir };
    }
} 