import { Collider, RigidBody } from "@dimforge/rapier3d-compat";
import SolWorld from "../core/SolWorld";
import { Group, Quaternion, Vector3 } from "three";
import { ActorUpdate } from "@solblade/client/actors/components/ActorUpdate";
import Controller from "./components/Controller";
import { Movement } from "./components/Movement";
import { SkeleSystem } from "@solblade/client/actors/components/SkeleSystem";
import FSM from "./states/FSM";

export interface ActorInint {
    id?: string;
    owner?: string;
    type?: string;
    name?: string;
    model?: string;
    worldName?: string;
    pos?: number[];
    rot?: number[];
    active?: boolean;
    lifetime?: number;
}

export class Actor implements ActorInint {
    id?: string;
    type?: string;
    name?: string;
    owner?: string;
    worldName?: string;
    model?: string;
    pos?: number[];
    rot?: number[];
    active?: boolean;
    lifetime?: number;

    controller?: Controller;
    movement?: Movement;
    animation?: SkeleSystem;
    fsm?: FSM;

    body?: RigidBody;
    world?: SolWorld;
    collider?: Collider;
    graphics?: Group;
    actorUpdate?: ActorUpdate;

    components = new Map<Function, any>();
    age = 0;
    _vecPos: Vector3;
    _quatRot: Quaternion;
    timestamp: number;
    constructor(data: ActorInint = {}) {
        this.id = data.id ?? crypto.randomUUID();
        this.type = data.type;
        this.name = data.name;
        this.owner = data.owner ?? null;
        this.worldName = data.worldName;
        this.model = data.model;

        this.pos = data.pos ?? [0, 1, 0];
        this.rot = data.rot ?? [0, 0, 0, 1];

        this.active = data.active;

        this.lifetime = data.lifetime;
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
    add<T>(component: T): T {
        this.components.set((component as any).constructor, component);
        return component;
    }
    get<T>(ctor: new (...args: any[]) => T): T {
        const v = this.components.get(ctor);
        if (!v) throw new Error(`Missing component: ${ctor.name}`);
        return v;
    }
    tick(dt: number) {
        for (const comp of this.components.values()) {
            comp.tick?.(dt);
        }
    }
    aim() {
        return {
            dir: undefined,
            camDir: undefined,
        }
    }
    serialize() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            owner: this.owner,
            worldName: this.worldName,
            model: this.model,

            pos: this.pos,
            rot: this.rot,

            active: this.active,
            lifetime: this.lifetime,
            age: this.age,
            timestamp: this.timestamp,
        }
    }
}