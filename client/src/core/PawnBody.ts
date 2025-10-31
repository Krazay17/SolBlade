import RAPIER from "@dimforge/rapier3d-compat"
import { Vector3 } from "three";

const GROUPS = {
    WORLD: 0b0001,
    PLAYER: 0b0010,
    ENEMY: 0b0100,
};

export default class PawnBody {
    world: RAPIER.World;
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    _position: Vector3 = new Vector3();
    _velocity: Vector3 = new Vector3();
    collideGroup: any
    constructor(world: RAPIER.World, pos: Vector3 = new Vector3(0, 0, 0), height: number = 1, radius: number = 0.5, isRemote = false) {
        this.world = world;
        this.collider = null;
        if (!this.world) throw new Error("invalid world passed to PawnBody");
        //const desc = isRemote ? RAPIER.RigidBodyDesc.kinematicPositionBased() : RAPIER.RigidBodyDesc.dynamic()
        this.body = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
            .lockRotations()
            .setTranslation(pos.x || 0, pos.y || 0, pos.z || 0)
            .setLinearDamping(0)
            .setAngularDamping(0)
        );
        this.collideGroup = (GROUPS.WORLD | GROUPS.ENEMY) << 16 | GROUPS.PLAYER
        if (isRemote) {
            this.collideGroup = (GROUPS.PLAYER) << 16 | GROUPS.ENEMY;
        }
        this.collider = this.world.createCollider(
            RAPIER.ColliderDesc.capsule(height / 2, radius)
                .setCollisionGroups(this.collideGroup)
                .setFriction(0)
                .setRestitution(0),
            this.body
        );
    }
    get position() {
        return this._position.copy(this.body.translation());
    }
    set position(pos: Vector3) {
        const flatVector = { x: pos.x, y: pos.y, z: pos.z };
        this.body.setTranslation(pos, true);
    }
    get velocity(): Vector3 {
        return this._velocity.copy(this.body.linvel());
    }
    set velocity(vel: { x: number, y: number, z: number }) {
        this.body.setLinvel(vel, true);
    }
    set velocityX(x: number) {
        const y = this.body.linvel().y;
        const z = this.body.linvel().z;
        this.body.setLinvel({ x, y, z }, true);
    }
    set velocityY(y: number) {
        const x = this.body.linvel().x;
        const z = this.body.linvel().z;
        this.body.setLinvel({ x, y, z }, true);
    }
    set velocityZ(z: number) {
        const x = this.body.linvel().x;
        const y = this.body.linvel().y;
        this.body.setLinvel({ x, y, z }, true);
    }
    sleep() {
        this.body.sleep();
    }
    wakeUp() {
        this.body.wakeUp();
    }
}