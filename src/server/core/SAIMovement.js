import { RigidBody } from "@dimforge/rapier3d-compat";

export default class SAIMovement {
    constructor(game, pawn, data = {}) {
        const {
            speed = 40,
            turnSpeed = 2,
        } = data;
        this.game = game;
        this.pawn = pawn;
        /**@type {RigidBody} */
        this.body = pawn.body;

        this.speed = speed;
        this.turnSpeed = turnSpeed;
    }
    get actorManager() { return this.game.actorManager };
    move(dt, dir) {
        const avoid = this.avoidOtherEnemies();
        dir.x += avoid.x;
        dir.z += avoid.z;

        const len = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
        if (len > 0.001) {
            dir.x /= len;
            dir.z /= len;
        }

        const faceAngle = Math.atan2(dir.x, dir.z);
        this.pawn.yaw = lerpAngle(this.pawn.yaw, faceAngle, dt * this.turnSpeed);

        const y = this.body.linvel().y;
        const d = this.speed * 10 * dt;
        const velocity = { x: dir.x * d, y, z: dir.z * d };
        this.body.setLinvel(velocity, true);

        return len;
    }
    avoidOtherEnemies() {
        const avoidRadius = 1.0;  // distance within which enemies start avoiding
        const strength = 1.0;     // how strongly they push away
        const result = { x: 0, z: 0 };

        const worldActors = this.actorManager.actorsOfScene[this.pawn.sceneName];
        if (!worldActors || !worldActors.enemies) return result;

        const myPos = this.pawn.position;

        for (const other of worldActors.enemies) {
            if (other === this.pawn || !other.active) continue;

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
    stop() {
        this.body.setLinvel({ x: 0, y: 0, z: 0 }, false);
    }
    update(dt) { }
}

function lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
}