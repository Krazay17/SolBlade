import RAPIER from "@dimforge/rapier3d-compat"
import ClientActor from "../actors/ClientActor.js"
import { Vector3 } from "three";

const GROUPS = {
    WORLD: 0b0001,
    PLAYER: 0b0010,
    ENEMY: 0b0100,
};

export default class PawnBody {
    world: RAPIER.World;
    actor: ClientActor;
    body: RAPIER.RigidBody;
    collider: RAPIER.Collider;
    _position: Vector3 = new Vector3();
    _velocity: Vector3 = new Vector3();
    collideGroup: any;
    startPos: Vector3;
    height: number;
    radius: number;
    constructor(world: RAPIER.World, actor: ClientActor, pos: Vector3 = new Vector3(0, 0, 0), height: number = 1, radius: number = 0.5, isRemote = false) {
        this.world = world;
        this.actor = actor;
        this.height = height;
        this.radius = radius;
        this.startPos = pos;
        this.body = null;
        this.collider = null;
        if (!this.world) throw new Error("invalid world passed to PawnBody");
        const desc = isRemote ? RAPIER.RigidBodyDesc.kinematicPositionBased() : RAPIER.RigidBodyDesc.dynamic()

        this.collideGroup = (GROUPS.WORLD | GROUPS.ENEMY) << 16 | GROUPS.PLAYER
        if (isRemote) {
            this.collideGroup = (GROUPS.PLAYER) << 16 | GROUPS.ENEMY;
        }
        this.body = this.world.createRigidBody(desc
            .lockRotations()
            .setTranslation(this.startPos.x || 0, this.startPos.y || 0, this.startPos.z || 0)
            .setLinearDamping(0)
            .setAngularDamping(0)
        );

        this.collider = this.world.createCollider(
            RAPIER.ColliderDesc.capsule(this.height / 2, this.radius)
                .setCollisionGroups(this.collideGroup)
                .setContactSkin(.01)
                .setFriction(0)
                .setRestitution(0),
            this.body
        );
        (this.collider as any).actor = this.actor.id;
        this.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    }
    get position() {
        return this._position.copy(this.body?.translation());
    }
    set position(pos: Vector3) {
        this.body.setTranslation(pos, false);
    }
    get rotation() {
        return this.body.rotation();
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
    get velocityY() {
        return this.body.linvel().y
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