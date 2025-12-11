import { Actor } from "@solblade/common/actors/Actor";

export class ActorUpdate {
    actor: Actor;
    onUpdateName: (name: string) => {};
    onUpdatePos: (pos: number[]) => {};
    onUpdateRot: (rot: number[]) => {};
    constructor(actor: Actor) {
        this.actor = actor;
    }
    update(data: Actor) {
        const { name, pos, rot } = data;
        this.updateName(name);
        this.updatePos(pos);
        this.updateRot(rot);
    }
    updateName(name: string) {
        if (!name) return;
        if (this.actor.name === name) return;
        this.actor.name = name;
        if (this.onUpdateName) this.onUpdateName(name)
    }
    updatePos(pos: number[]) {
        if (!pos) return;
        const current = this.actor.pos;
        if (current.length === pos.length && current.every((v, i) => v === pos[i])) return;
        this.actor.pos = pos;
        if (this.onUpdatePos) this.onUpdatePos(pos);
    }
    updateRot(rot: number[]) {
        if (!rot) return;
        const current = this.actor.rot;
        if (current.length === rot.length && current.every((v, i) => v === rot[i])) return;
        this.actor.rot = rot;
        if (this.onUpdateRot) this.onUpdateRot(rot);
    }
}