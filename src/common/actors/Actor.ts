import { Collider, RigidBody } from "@dimforge/rapier3d-compat";
import { Group, Quaternion, Vector3 } from "three";
import { Movement } from "./components/Movement";
import { MeshSystem } from "@solblade/client/actors/components/MeshSystem";
import FSM from "./states/FSM";
import SolWorld from "../core/SolWorld";
import { PhysicsSync } from "./components/PhysicsSync";
import { ClientReplication } from "@solblade/client/actors/components/ClientReplication";
import { PhysicsConfig } from "../core/Physics";

interface Anim {
    name: string;
    time: number;
    scale: number;
    loop: boolean;
}
export interface ActorInit {
    id?: string;
    owner?: string;
    type?: string;
    name?: string;
    model?: string;
    worldName?: string;
    pos?: number[];
    rot?: number[];
    scale?: number;
    active?: boolean;
    lifetime?: number;
    world?: SolWorld;
    physicsConfig?: PhysicsConfig;
}

export class Actor implements ActorInit {
    id?: string;
    type?: string;
    name?: string;
    owner?: string;
    worldName?: string;
    model?: string;
    pos?: number[];
    rot?: number[];
    scale?: number;
    anim?: Anim;
    active?: boolean;
    lifetime?: number;

    world?: SolWorld;
    controller?: any;
    movement?: Movement;
    mesh?: MeshSystem;
    fsm?: FSM;

    body?: RigidBody;
    collider?: Collider;
    physicsConfig?: PhysicsConfig;
    graphics?: Group;
    replication?: ClientReplication;
    physicsSync: PhysicsSync = new PhysicsSync(this);

    components = new Map<Function, any>();
    age = 0;
    _vecPos: Vector3;
    _quatRot: Quaternion;
    _vecRot: Vector3;
    timestamp: number;
    constructor(data: ActorInit = {}) {
        this.id = data.id ?? crypto.randomUUID();
        this.type = data.type ?? "wizard";
        this.name = data.name ?? "Gary";
        this.owner = data.owner ?? null;
        this.worldName = data.worldName ?? "world1";
        this.model = data.model ?? "Wizard";

        this.world = data.world ?? null;

        this.pos = data.pos ?? [0, 1, 0];
        this.rot = data.rot ?? [0, 0, 0, 1];
        this.scale = data.scale ?? 1;
        this.physicsConfig = data.physicsConfig ?? null;

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
        this._vecRot.set(0, 0, 1);
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
        if (this.controller) this.controller.tick(dt);
        if (this.fsm && this.body) this.fsm.update(dt);
        if (this.physicsSync) this.physicsSync.tick(dt);
        if (this.movement) this.movement.update(dt);
        if (this.mesh) this.mesh.update(dt);
        for (const comp of this.components.values()) {
            comp.tick?.(dt);
        }

        if (this.replication) this.replication.tick(dt);
    }
    aim() {
        const pos = this.vecPos.clone();
        pos.y += 0.8;
        pos.addScaledVector(this.vecRot, .5);
        return {
            dir: this.vecRot,
            pos,
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