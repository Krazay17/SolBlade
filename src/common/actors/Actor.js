export default class Actor {
    constructor(data = {}) {
        const {
            id = '1',
            tempId = data.tempId ?? crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10),
            type = null,
            subtype = null,
            name = "actor",
            owner = null,
            worldName = 'world1',
            pos = [0, 0, 0],
            dir = [0, 0, 0],
            rot = [0, 0, 0, 1],
            active = true,
            isRemote = true,
            lifetime = 0,
        } = data;
        this.data = data;

        this.id = id;
        this.tempId = tempId;
        this.type = type;
        this.subtype = subtype;
        this.name = name;
        this.owner = owner;
        this.worldName = worldName;

        this.pos = pos;
        this.dir = dir;
        this.rot = rot;

        this.active = active;
        this.isRemote = isRemote;
        this.lifetime = lifetime;
        this.age = 0;
        this.timestamp = performance.now();
    }
    serialize() {
        return {
            ...this.data,

            id: this.id,
            tempId: this.tempId,
            type: this.type,
            subtype: this.subtype,
            name: this.name,
            owner: this.owner,
            worldName: this.worldName,

            pos: this.pos,
            dir: this.dir,
            rot: this.rot,

            active: this.active,
            isRemote: this.isRemote,
            lifetime: this.lifetime,
            age: this.age,
            timestamp: this.timestamp,
        }
    }
}