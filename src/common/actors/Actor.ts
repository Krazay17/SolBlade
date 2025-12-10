import { Collider, RigidBody } from "@dimforge/rapier3d-compat";
import SolWorld from "../core/SolWorld";
import { Group, Quaternion, Vector3 } from "three";
import { ActorUpdate } from "@solblade/client/actors/components/ActorUpdate";
import Controller from "./components/Controller";
import { Movement } from "./components/Movement";
import { SkeleSystem } from "@solblade/client/actors/components/SkeleSystem";
import FSM from "./states/FSM";

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
    rot: number[];
    active: boolean;
    isRemote: boolean;
    lifetime: number;
    age: number;
    timestamp: number;

    controller?: Controller;
    movement?: Movement;
    animation?: SkeleSystem;
    fsm?: FSM;

    components = new Map<string, any>();
    body?: RigidBody;
    world?: SolWorld;
    collider?: Collider;
    graphics?: Group;
    actorUpdate?: ActorUpdate;

    _vecPos: Vector3;
    _quatRot: Quaternion;
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
            rot = [0, 0, 0, 1],
            active = true,
            isRemote = true,
            lifetime = 0,
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
        this.rot = rot;

        this.active = active;
        this.isRemote = isRemote;
        this.lifetime = lifetime;
        this.age = 0;
        this.timestamp = performance.now();
    }
    get vecPos() {
        if (!this._vecPos) this._vecPos = new Vector3();
        return this._vecPos.fromArray(this.pos);
    }
    get quatRot() {
        if (!this._quatRot) this._quatRot = new Quaternion();
        return this._quatRot.fromArray(this.rot);
    }
    setId(id) {
        this.id = id;
        console.log(id);
    }
    add<T>(key: string, c: T): T {
        this.components.set(key, c);
        return c;
    }
    get<T>(key: string): T {
        return this.components.get(key);
    }
    tick(dt: number) {
        for (const comp of this.components.values()) {
            comp.tick?.(dt);
        }
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
            rot: this.rot,

            active: this.active,
            isRemote: this.isRemote,
            lifetime: this.lifetime,
            age: this.age,
            timestamp: this.timestamp,
        }
    }
}