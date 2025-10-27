import RAPIER from "@dimforge/rapier3d-compat";

export default class SrvEnemy {
    constructor(world, data = {}) {
        /**@type {RAPIER.World} */
        this.world = world;
        this.data = data;
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
        console.log(this.body.translation());
    }
    hit(data) {
        this.body.setLinvel({ x: data.impulse[0], y: data.impulse[1], z: data.impulse[2] }, true);
    }
}