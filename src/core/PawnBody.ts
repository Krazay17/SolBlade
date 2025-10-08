import RAPIER from "@dimforge/rapier3d-compat"
import { Vector3 } from "three";

export default class PawnBody {
    world: RAPIER.World;
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    _position: Vector3 = new Vector3();
    _velocity: Vector3 = new Vector3();
    constructor(world: RAPIER.World, pos: Vector3 = new Vector3(0, 0, 0), height: number = 1, radius: number = 0.5) {
        this.world = world;
        this.body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
            .lockRotations()
            .setTranslation(pos.x || 0, pos.y || 0, pos.z || 0)
            .setLinearDamping(0)
            .setAngularDamping(0)
        );
        this.collider = world.createCollider(RAPIER.ColliderDesc.capsule(height / 2, radius)
            .setFriction(0)
            .setRestitution(0),
            this.body
        );
        this.body.sleep();
    }
    get position() {
        return this._position.copy(this.body.translation());
    }
    set position(pos: { x: number, y: number, z: number }) {
        this.body.setTranslation(pos, true);
    }
    get velocity(): Vector3 {
        return this._velocity.copy(this.body.linvel());
    }
    set velocity(vel: { x: number, y: number, z: number }) {
        this.body.setLinvel(vel, true);
    }
    sleep() {
        this.body.sleep();
    }
    wakeUp() {
        this.body.wakeUp();
    }
}