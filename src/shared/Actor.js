import { randomUUID } from 'crypto';

export default class Actor {
    constructor(data = {}) {
        const {
            type = '',
            name = '',
            netId = null,
            owner = null,
            solWorld = 'world1',
            pos = { x: 0, y: 0, z: 0 },
            rot = { x: 0, y: 0, z: 0, w: 1 },
            isRemote = false,
            replicate = false,
            active = true,
            ...extra
        } = data;
        Object.assign(this, extra);
        this.data = data;

        this.type = type;
        this.name = name;
        this.netId = netId;
        this.owner = owner;
        this.solWorld = solWorld;

        this.pos = pos;
        this.rot = rot;

        this.isRemote = isRemote;
        this.replicate = replicate;
        this.active = active;
        this.destroyed = false;

        this.tempId = randomUUID();
    }
    update(dt, time) { };
    fixedUpdate(dt, time) { };

    serialize() {
        return {
            ...this.data,
            type: this.type,
            name: this.name,
            netId: this.netId,
            owner: this.owner,
            solWorld: this.solWorld,
            tempId: this.tempId,

            pos: this.pos.toArray ? this.pos.toArray() : this.pos,
            rot: this.rot.toArray ? this.rot.toArray() : this.rot,

            isRemote: this.isRemote,
            replicate: this.replicate,
            active: this.active,
            destroyed: this.destroyed,
        }
    }
    deActivate() {
        this.active = false;
    }
    destroy() {
        this.active = false;
        this.destroyed = true;
        this.netId = '';
        this.tempId = '';
    }
}