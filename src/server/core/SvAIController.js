import ActorManager from "./SActorManager.js";

export default class SrvAIController {
    constructor(actor, actorManager) {
        this.actor = actor;
        /**@type {ActorManager} */
        this.actorManager = actorManager;
    }
    update(dt) {
        const player = this.findNearestPlayer();
        let dir = { x: 0, y: 0, z: 0 };
        if (player) {
            dir = this.directionToPlayer(player);
        }
        const avoid = this.avoidOtherEnemies();
        dir.x += avoid.x;
        dir.z += avoid.z;

        const len = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
        if (len > 0.001) {
            dir.x /= len;
            dir.z /= len;
        }

        const faceAngle = Math.atan2(dir.x, dir.z);
        this.actor.rotation = lerpAngle(this.actor.rotation, faceAngle, this.actor.turnSpeed * dt);
        this.actor.move(dir);
    }
    avoidOtherEnemies() {
        const avoidRadius = 1.0;  // distance within which enemies start avoiding
        const strength = 1.0;     // how strongly they push away
        const result = { x: 0, z: 0 };

        const worldActors = this.actorManager.actorsOfWorld[this.actor.sceneName];
        if (!worldActors || !worldActors.enemies) return result;

        const myPos = this.actor.position;

        for (const other of worldActors.enemies) {
            if (other === this.actor || !other.active) continue;

            const pos = other.position;
            const dx = myPos.x - pos.x;
            const dz = myPos.z - pos.z;
            const distSq = dx * dx + dz * dz;

            if (distSq > avoidRadius * avoidRadius || distSq < 0.0001) continue;

            const dist = Math.sqrt(distSq);
            const push = (avoidRadius - dist) / avoidRadius; // how close they are (0-1)
            result.x += (dx / dist) * push * strength;
            result.z += (dz / dist) * push * strength;
        }

        return result;
    }

    findNearestPlayer() {
        const { players } = this.actorManager.actorsOfWorld[this.actor.data.sceneName]
        if (!players.length) return;

        // get this enemy's position
        const pos = this.actor.position;

        // find nearest player
        let nearest = null;
        let minDistSq = Infinity;
        for (const p of players) {
            const dx = p.pos.x - pos.x;
            const dy = p.pos.y - pos.y;
            const dz = p.pos.z - pos.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < this.actor.aggroRadius && (distSq < minDistSq)) {
                minDistSq = distSq;
                nearest = p;
            }
        }
        return nearest;
    }
    directionToPlayer(player) {
        if (!player) return;
        const pos = this.actor.position;
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
function lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
}