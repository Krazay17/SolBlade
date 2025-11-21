export default class Actor {
    constructor(data = {}) {
        const {
            id = '1',
            tempId = data.tempId ?? crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10),
            type = null,
            name = null,
            owner = null,
            worldName = 'scene2',
            pos = [0, 0, 0],
            dir = [0, 0, 0],
            rot = [0, 0, 0, 1],
            active = true,
            lifetime = 0,
        } = data;
        this.data = data;

        this.id = id;
        this.tempId = tempId;
        this.type = type;
        this.name = name;
        this.owner = owner;
        this.worldName = worldName;

        this.pos = pos;
        this.dir = dir;
        this.rot = rot;

        this.active = active;
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
            name: this.name,
            owner: this.owner,
            worldName: this.worldName,

            pos: this.pos,
            dir: this.dir,
            rot: this.rot,

            active: this.active,
            lifetime: this.lifetime,
            age: this.age,
            timestamp: this.timestamp,
        }
    }
}