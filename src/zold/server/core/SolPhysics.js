import RAPIER from "@dimforge/rapier3d-compat";
import { COLLISION_GROUPS } from "@solblade/common/data/SolConstants.js";
import { Vector3 } from "three";

export default class SolPhysics {
    constructor(game) {
        this.game = game;
        this.gravity = new Vector3(0, -6, 0);
        this.world = new RAPIER.World(this.gravity);
        this.eventQue = new RAPIER.EventQueue(true);
        this.pendingRemoval = [];

        this.meleeCapsule = new RAPIER.Capsule(.5, 1);
    }
    step() {
        this.world.step(this.eventQue);
        this.eventQue.drainCollisionEvents((handle1, handle2, started) => {
            const collider1 = this.world.getCollider(handle1);
            const collider2 = this.world.getCollider(handle2);

            const actor1 = collider1.actor;
            const actor2 = collider2.actor;

            if (!actor1 || !actor2) return;
            if (started) {
                const actorFromId = this.game.getActorById(actor2);
                if (!actorFromId) return;
                actorFromId.touch?.(actor1);
            }
        })
        this.remove();
    }
    safeRemoveBody(body) {
        if (!body || !this.world.getRigidBody(body.handle)) return;
        this.pendingRemoval.push({ type: 'body', obj: body });
    }
    safeRemoveCollider(collider) {
        if (!collider || !this.world.getCollider(collider.handle)) return;
        this.pendingRemoval.push({ type: 'collider', obj: collider });
    }
    remove() {
        if (this.pendingRemoval.length <= 0) return;

        for (const r of this.pendingRemoval) {
            try {
                switch (r.type) {
                    case 'body': {
                        const handle = r.obj?.handle;
                        if (typeof handle === 'undefined') {
                            console.warn('remove: body has no handle', r.obj);
                            break;
                        }
                        const rb = this.world.getRigidBody(handle);
                        if (!rb) {
                            // already gone — skip
                            break;
                        }
                        this.world.removeRigidBody(rb, true);
                    } break;

                    case 'collider': {
                        const handle = r.obj?.handle;
                        if (typeof handle === 'undefined') {
                            console.warn('remove: collider has no handle', r.obj);
                            break;
                        }
                        const col = this.world.getCollider(handle);
                        if (!col) {
                            break;
                        }
                        this.world.removeCollider(col);
                    } break;

                    default:
                        console.log('no type!');
                }
            } catch (err) {
                // Catch the WASM panic and print debug info instead of blowing up.
                console.error('Error removing pending object', r.type, r.obj, err);
            }
        }

        this.pendingRemoval.length = 0;
    }
    meleeTrace(pos, rot, range = 1, callback = () => { }) {
        if (this.meleeCapsule.radius !== range) this.meleeCapsule.radius = range;
        this.world.intersectionsWithShape(
            pos, rot,
            this.meleeCapsule, callback,
            COLLISION_GROUPS.ENEMY << 16 | COLLISION_GROUPS.PLAYER
        )
    }
}