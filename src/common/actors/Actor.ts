export default class Actor {
    id: string;
    tempId: string;
    type: string;
    subtype: string;
    name: string;
    owner: string;
    worldName: string;
    meshName: string;
    pos: number[];
    dir: number[];
    rot: number[];
    active: boolean;
    isRemote: boolean;
    lifetime: number;
    height: number;
    radius: number;
    age: number;
    timestamp: number;
    constructor(data: any = {}) {
        const {
            id = '1',
            tempId = data.tempId ?? crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 10),
            type = 'player',
            subtype = null,
            name = "actor",
            owner = null,
            worldName = 'world1',
            meshName = "spikeMan",
            pos = [0, 0, 0],
            dir = [0, 0, 0],
            rot = [0, 0, 0, 1],
            active = true,
            isRemote = true,
            lifetime = 0,
            height = 1,
            radius = 0.5,
        } = data;

        this.id = id;
        this.tempId = tempId;
        this.type = type;
        this.subtype = subtype;
        this.name = name;
        this.owner = owner;
        this.worldName = worldName;
        this.meshName = meshName;

        this.pos = pos;
        this.dir = dir;
        this.rot = rot;
        this.height = height;
        this.radius = radius;

        this.active = active;
        this.isRemote = isRemote;
        this.lifetime = lifetime;
        this.age = 0;
        this.timestamp = performance.now();
    }
    serialize() {
        return {
            id: this.id,
            tempId: this.tempId,
            type: this.type,
            subtype: this.subtype,
            name: this.name,
            owner: this.owner,
            worldName: this.worldName,
            meshName: this.meshName,

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