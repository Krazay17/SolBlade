export default class Actor {
    constructor(data = {}) {
        const {
            id = '1',
            type,
            name,
            owner,
            sceneName = 'scene2',
            pos = [0, 0, 0],
            dir = [0, 0, 0],
            rot = [0, 0, 0, 1],
            active = true,
            lifetime = 0,
            isRemote = false,
            tempId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10),
        } = data;
        this.data = data;

        this.id = id;
        this.type = type;
        this.name = name;
        this.owner = owner;
        this.sceneName = sceneName;
        this.tempId = tempId;

        this.pos = pos;
        this.dir = dir;
        this.rot = rot;

        this.active = active;
        this.destroyed = false;

        this.isRemote = isRemote;
        this.lifetime = lifetime;

        this.age = 0;
        this.timestamp = performance.now();
    }
    init() { };
    update(dt, time) { };
    fixedUpdate(dt, time) { };
    serialize() {
        return {
            ...this.data,
            id: this.id,
            type: this.type,
            name: this.name,
            owner: this.owner,
            sceneName: this.sceneName,
            tempId: this.tempId,

            pos: this.pos.toArray ? this.pos.toArray() : this.pos,
            dir: this.dir.toArray ? this.dir.toArray() : this.dir,
            rot: this.rot.toArray ? this.rot.toArray() : this.rot,

            active: this.active,
            isRemote: this.isRemote,
            lifetime: this.lifetime,

            age: this.age,
            timestamp: this.timestamp,
        }
    }
    activate() { }
    deActivate() {
        this.active = false;
    }
    destroy() { 
        this.destroyed = true;
    }
}