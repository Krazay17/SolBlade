import {Actor} from "@solblade/common/actors/Actor";

export class ActorUpdate {
    owner: Actor;
    onUpdateName: (name: string) => {};
    onUpdatePos: (pos: number[]) => {};
    onUpdateRot: (rot: number[]) => {};
    constructor(owner: Actor) {
        this.owner = owner;

    }
    update(data: Actor) {
        const { name, pos, rot } = data;
        this.updateName(name);
        this.updatePos(pos);
        this.updateRot(rot);
    }
    updateName(name: string) {
        if (this.owner.name === name) return;
        this.owner.name = name;
        if (this.onUpdateName) this.onUpdateName(name)
    }
    updatePos(pos: number[]) {
        const current = this.owner.pos;
        if (current.length === pos.length && current.every((v, i) => v === pos[i])) return;
        this.owner.pos = pos;
        if (this.onUpdatePos) this.onUpdatePos(pos);
    }
    updateRot(rot: number[]) {
        const current = this.owner.rot;
        if (current.length === rot.length && current.every((v, i) => v === rot[i])) return;
        this.owner.rot = rot;
        if (this.onUpdateRot) this.onUpdateRot(rot);
    }
}