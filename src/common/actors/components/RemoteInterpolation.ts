import { Group, Quaternion } from "three";
import { Actor } from "../Actor";

export class RemoteInterpolation {
    actor: Actor
    groups: Group[] = [];
    constructor(actor: Actor, group?: Group) {
        this.actor = actor;
        this.addGroup(group);
    }
    addGroup(group: Group) {
        this.groups.push(group);
    }
    tick(dt: number) {
        if (this.groups.length < 1) return;
        for (const g of this.groups) {
            if (g === undefined) return;
            const posTo = this.actor.vecPos;
            const rotTo = this.actor.quatRot as Quaternion;
            const posFrom = g.position;
            const rotFrom = g.quaternion;
            const dist = posFrom.distanceTo(posTo);
            const rotDif = rotFrom.angleTo(rotTo);
            if (dist > 0.001) {
                if (dist < 25) posFrom.lerp(posTo, dt * 60);
                else posFrom.copy(posTo);
            }
            if (rotDif > 0.001) {
                if (rotDif < 5) rotFrom.slerp(rotTo, dt * 60);
                else rotFrom.copy(rotTo);
            }
        }
    }
}