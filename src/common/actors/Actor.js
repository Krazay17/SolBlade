import RAPIER from "@dimforge/rapier3d-compat";
import { COLLISION_GROUPS } from "../config/SolConstants";


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
            height = 1,
            radius = 0.5,
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
            ...this.data,

            id: this.id,
            tempId: this.tempId,
            type: typeMap[this.type],
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
    makeBody(world, height = this.height, radius = this.radius) {
        const collideGroup = this.isRemote
            ? COLLISION_GROUPS.WORLD | COLLISION_GROUPS.PLAYER << 16 | COLLISION_GROUPS.ENEMY
            : COLLISION_GROUPS.ENEMY << 16 | COLLISION_GROUPS.PLAYER;
        const bDesc = RAPIER.RigidBodyDesc.dynamic();
        bDesc.setTranslation(this.pos[0], this.pos[1], this.pos[2]);
        bDesc.lockRotations();
        bDesc.setLinearDamping(0);
        bDesc.setAngularDamping(0);
        const cDesc = RAPIER.ColliderDesc.capsule(height, radius);
        cDesc.setCollisionGroups(collideGroup);
        cDesc.setFriction(0);
        cDesc.setRestitution(0);

        this.body = world.createRigidBody(bDesc)
        this.collider = world.createCollider(cDesc, this.body);
    }
}
const typeMap = {
    "player": 0,
}