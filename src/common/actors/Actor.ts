import { Collider, RigidBody } from "@dimforge/rapier3d-compat";
import { Group, Quaternion, Vector3 } from "three";
import Controller from "./components/Controller";
import { Movement } from "./components/Movement";
import { SkeleSystem } from "@solblade/client/actors/components/SkeleSystem";
import FSM from "./states/FSM";
import SolWorld from "../core/SolWorld";
import { PhysicsSync } from "./components/PhysicsSync";
import { ClientReplication } from "@solblade/client/actors/components/ClientReplication";

interface Anim {
    name: string;
    time: number;
    scale: number;
    loop: boolean;
}
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
    world?: SolWorld;
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
    anim?: Anim;
    active?: boolean;
    lifetime?: number;

    world?: SolWorld;
    controller?: Controller;
    movement?: Movement;
    animation?: SkeleSystem;
    fsm?: FSM;

    body?: RigidBody;
    collider?: Collider;
    graphics?: Group;
    replication?: ClientReplication;
    physicsSync: PhysicsSync = new PhysicsSync(this);

    components = new Map<Function, any>();
    age = 0;
    _vecPos: Vector3;
    _quatRot: Quaternion;
    _vecRot: Vector3;
    timestamp: number;
    constructor(data: ActorInint = {}) {
        this.id = data.id ?? crypto.randomUUID();
        this.type = data.type ?? "wizard";
        this.name = data.name ?? "Dude";
        this.owner = data.owner ?? null;
        this.worldName = data.worldName ?? "world1";
        this.model = data.model ?? "Wizard";

        this.world = data.world ?? null;

        this.pos = data.pos ?? [0, 1, 0];
        this.rot = data.rot ?? [0, 0, 0, 1];

        this.active = data.active ?? true;

        this.lifetime = data.lifetime ?? undefined;
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
    get vecRot() {
        if (!this._vecRot) this._vecRot = new Vector3();
        return this._vecRot.applyQuaternion(this.quatRot);
    }
    set vecPos(v: Vector3) {
        if (!this._vecPos) this._vecPos = new Vector3();
        this._vecPos.copy(v);
        this.pos[0] = v.x;
        this.pos[1] = v.y;
        this.pos[2] = v.z;
    }
    set quatRot(v: Quaternion) {
        if (!this._quatRot) this._quatRot = new Quaternion();
        this._quatRot.copy(v);
        this.rot[0] = v.x;
        this.rot[1] = v.y;
        this.rot[2] = v.z;
        this.rot[3] = v.w;
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
        if (this.controller) this.controller.update(dt);
        if (this.fsm && this.body) this.fsm.update(dt);
        if (this.physicsSync) this.physicsSync.tick(dt);
        if (this.movement) this.movement.update(dt);
        if (this.animation) this.animation.update(dt);
        for (const comp of this.components.values()) {
            comp.tick?.(dt);
        }
        if (this.replication) this.replication.tick(dt);
    }
    aim() {
        return {
            dir: undefined,
            camDir: undefined,
        }
    }
    destroy() {
        this.components.forEach((v, k) => {
            v.destroy?.();
        });
        this.active = false;
    }
    serialize() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            owner: this.owner,
            worldName: this.worldName,
            model: this.model,
            anim: this.anim,

            pos: this.pos,
            rot: this.rot,

            active: this.active,
            lifetime: this.lifetime,
            age: this.age,
            timestamp: this.timestamp,
        }
    }
}