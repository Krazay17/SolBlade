import RAPIER from "@dimforge/rapier3d-compat";

export default class SrvEnemy {
    constructor(world, data = {}, actorManager) {
        /**@type {RAPIER.World} */
        this.world = world;
        this.data = data;
        this.actorManager = actorManager;
        const height = data.height || 1;
        const radius = data.radius || 0.5;
        this.body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
            .lockRotations()
            .setTranslation(data.pos.x || 0, data.pos.y || 0, data.pos.z || 0)
            .setLinearDamping(0)
            .setAngularDamping(0)
        );
        this.collider = world.createCollider(RAPIER.ColliderDesc.capsule(height / 2, radius)
            .setFriction(0)
            .setRestitution(0),
            this.body
        );

        this.active = true;
        this.stunned = false;
    }
    hit(data) {
        if (data.impulse) {
            this.body.setLinvel({ x: data.impulse[0], y: data.impulse[1], z: data.impulse[2] }, true);
            this.stunned = true;
            setTimeout(() => this.stunned = false, 800);
        }
    }
    die() {
        this.world.removeCollider(this.collider);
        this.active = false;
    }
    update(dt, players) {
        if (!this.active) return;
        if (!players.length) return;

        // get this enemy's position
        const pos = this.body.translation();
        if (pos.y < -50) return this.actorManager.actorDie({ target: this.data.netId });

        // find nearest player
        let nearest = null;
        let minDistSq = Infinity;
        for (const p of players) {
            const dx = p.pos.x - pos.x;
            const dy = p.pos.y - pos.y;
            const dz = p.pos.z - pos.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < minDistSq) {
                minDistSq = distSq;
                nearest = p;
            }
        }

        if (!nearest) return;
        if (this.stunned) return;

        // move toward that player
        const speed = 3; // m/s
        const dir = {
            x: nearest.pos.x - pos.x,
            y: nearest.pos.y - pos.y,
            z: nearest.pos.z - pos.z,
        };
        const len = Math.sqrt(dir.x ** 2 + dir.y ** 2 + dir.z ** 2);
        if (len > 0.001) {
            dir.x /= len;
            dir.y /= len;
            dir.z /= len;
            this.body.setLinvel({
                x: dir.x * speed,
                y: this.body.linvel().y, // preserve vertical velocity
                z: dir.z * speed,
            }, true);
        }
    }

}