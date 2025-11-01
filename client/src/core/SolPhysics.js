import RAPIER, { World } from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";
import HitData from "./HitData";

export default class SolPhysics {
    constructor() {
        this.gravity = new Vector3(0, -6, 0);
        this.world = new World(this.gravity);
        this.eventQue = new RAPIER.EventQueue();
        this.pendingRemoval = [];
    }
    step() {
        this.world.step(this.eventQue);
        this.eventQue.drainCollisionEvents((handle1, handle2, started)=>{
            const collider1 = this.world.getCollider(handle1);
            const collider2 = this.world.getCollider(handle2);

            const actor1 = collider1.actor;
            const actor2 = collider2.actor;

            if(started) {
                actor2.touch?.(actor1);
            } else {
                console.log(`Collision ended- actor1: ${actor1}, actor2: ${actor2}`);
            }
        })
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