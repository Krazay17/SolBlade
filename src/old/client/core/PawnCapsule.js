import RAPIER from "@dimforge/rapier3d-compat"
import { Vector3 } from "three";
import { COLLISION_GROUPS } from "../../old/shared";

export default class PawnBody {
    constructor(world, actor, pos = new Vector3(0, 0, 0), height = 1, radius = 0.5, isRemote = false) {
        this.world = world;
        this.actor = actor;
        this.height = height;
        this.radius = radius;
        this.startPos = pos;
        this.body = null;
        this.collider = null;
        this.isRemote = isRemote;
        if (!this.world) throw new Error("invalid world passed to PawnBody");
        const desc = isRemote ? RAPIER.RigidBodyDesc.kinematicPositionBased() : RAPIER.RigidBodyDesc.dynamic()

        this.collideGroup = (COLLISION_GROUPS.WORLD | COLLISION_GROUPS.ENEMY) << 16 | COLLISION_GROUPS.PLAYER
        if (isRemote) {
            this.collideGroup = COLLISION_GROUPS.PLAYER << 16 | COLLISION_GROUPS.ENEMY;
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
        this.collider.actor = this.actor.id;
        if (!this.isRemote) this.collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    }
    get position() {
        return this._position.copy(this.body?.translation());
    }
    set position(pos) {
        this.body.setTranslation(pos, false);
    }
    get rotation() {
        return this.body.rotation();
    }
    get velocity() {
        return this._velocity.copy(this.body.linvel());
    }
    set velocity(vel) {
        this.body.setLinvel(vel, true);
    }
    set velocityX(x) {
        const y = this.body.linvel().y;
        const z = this.body.linvel().z;
        this.body.setLinvel({ x, y, z }, true);
    }
    set velocityY(y) {
        const x = this.body.linvel().x;
        const z = this.body.linvel().z;
        this.body.setLinvel({ x, y, z }, true);
    }
    get velocityY() {
        return this.body.linvel().y
    }
    set velocityZ(z) {
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