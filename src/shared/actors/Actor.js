import { Vector3, Quaternion } from "three";

export default class Actor {
    constructor(data = {}) {
        const {
            type = '',
            name = '',
            netId = null,
            owner = null,
            solWorld = 'world1',
            pos = new Vector3(),
            rot = new Quaternion(0, 0, 0, 1),
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

        /**@type {Vector3} */
        this.pos = pos;
        /**@type {Quaternion} */
        this.rot = rot;

        this.isRemote = isRemote;
        this.replicate = replicate;
        this.active = active;
        this.destroyed = false;

        this.tempId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10);
    }
    get position() { return this.pos };
    init() { };
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
    activate(data = {}) {
        Object.assign(this, data);
        this.active = true;
        if (data.pos) {
            this.pos = data.pos;
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