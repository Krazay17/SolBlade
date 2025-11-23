import RAPIER, { World } from "@dimforge/rapier3d-compat";


export default class PawnBody {
    constructor(physics, actor) {
        /**@type {World} */
        this.physics = physics;
        this.actor = actor;

        this.body = this.physics.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased())
    }
}