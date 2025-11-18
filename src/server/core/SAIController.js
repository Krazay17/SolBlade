export default class SAIController {
    /**
     * 
     * @param {*} game 
     * @param {*} pawn 
     * @param {{
     * aggroRadius: number
     * }} data 
     */
    constructor(game, pawn, data = {}) {
        const {
            aggroRadius = 5,
        } = data
        this.game = game;
        this.pawn = pawn;
        this.actorManager = game.actorManager;

        this.aggroRadius = aggroRadius;

        this.blackboard = {};
        this.pawnRangeActions = null;
    }
    update(dt) {
        const { player, dist } = this.findNearestPlayer();
        let dir = { x: 0, y: 0, z: 0 };
        if (player) {
            dir = this.directionToPlayer(player);
            this.blackboard = { player, dir, dist };
        } else this.blackboard = {};
    }
    findNearestPlayer() {
        const { players } = this.actorManager.actorsOfScene[this.pawn.sceneName]
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
            if (distSq < this.aggroRadius ** 2 && (distSq < minDistSq)) {
                minDistSq = distSq;
                nearest = p;
            }
        }
        return { player: nearest, dist: minDistSq };
    }
    directionToPlayer(player) {
        if (!player) return;
        const pos = this.pawn.position;
        const dir = {
            x: player.pos.x - pos.x,
            y: player.pos.y - pos.y,
            z: player.pos.z - pos.z,
        };
        const len = Math.sqrt(dir.x ** 2 + dir.y ** 2 + dir.z ** 2);
        if (len > 0.001) {
            dir.x /= len;
            dir.y /= len;
            dir.z /= len;
        }
        return dir;
    }
}