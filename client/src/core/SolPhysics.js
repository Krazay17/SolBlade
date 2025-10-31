import RAPIER, { World } from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";

export default class SolPhysics {
    constructor() {
        this.gravity = new Vector3(0, -6, 0);
        this.world = new World(this.gravity);
        this.pendingRemoval = [];
    }
    safeRemoveBody(body) {
        if (!body) return;
        this.pendingRemoval.push({ type: 'body', obj: body });
    }
    safeRemoveCollider(collider) {
        if (!collider) return;
        this.pendingRemoval.push({ type: 'collider', obj: collider });
    }
    remove() {
        if (this.pendingRemoval.length <= 0) return;
        for (const r of this.pendingRemoval) {
            switch (r.type) {
                case 'body':
                    this.world.removeRigidBody(r.obj);
                    break;
                case 'collider':
                    this.world.removeCollider(r.obj, false);
                    break;
                default:
                    console.log('no type!');
            }
        }
        this.pendingRemoval.length = 0;
    }
}