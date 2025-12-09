import { Group } from "three";
import Actor from "../Actor";

export class RemoteInterpolation {
    actor: Actor
    groups: Group[];
    constructor(actor: Actor, groups?: Group[]) {
        this.actor = actor;
        this.groups = groups;
    }
    addGroup(group){
        this.groups.push(group);
    }
    tick(dt: number) {
        if (!this.groups) return;
        for (const g of this.groups) {
            const to = this.actor.vecPos;
            const from = g.position;
            const dist = g.position.distanceTo(this.actor.vecPos);
            if (dist > 0.001) {
                if (dist < 25) from.lerp(to, dt * 60);
                else from.copy(to);
            }
        }
    }
}