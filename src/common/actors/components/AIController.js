import Controller from "./Controller";

export default class AIController extends Controller {
    constructor(world, pawn, data = {}) {
        super(world, pawn);
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
        const { players } = this.world.actors;
        if (!players.length) return {};

        // get this enemy's position
        const pos = this.pawn.position;

        // find nearest player
        let nearest = null;
        let minDistSq = Infinity;
        let targetDir = null;
        for (const p of players) {
            const dx = p.pos.x - pos.x;
            const dy = p.pos.y - pos.y;
            const dz = p.pos.z - pos.z;
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