import Controller from "./Controller";

export default class AIController extends Controller {
    constructor(game, pawn, data = {}) {
        super(game, pawn);
        const {
            aggroRadius = 20
        } = data;
        this.aggroRadius = aggroRadius;

        this.blackboard = {};
    }
    update(dt) {

    }
    inputDirection() {

    }
    findNearestPlayer() {
        const { players } = this.game.solWorlds
        if (!players.length) return {};

        // get this enemy's position
        const pos = this.pawn.position;

        // find nearest player
        let nearest = null;
        let minDistSq = Infinity;
        for (const p of players) {
            const dx = p.pos.x - pos.x;
            const dy = p.pos.y - pos.y;
            const dz = p.pos.z - pos.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < this.aggroRadius && (distSq < minDistSq)) {
                minDistSq = distSq;
                nearest = p;
            }
        }
        return { player: nearest, dist: Math.sqrt(minDistSq) };
    }
} 