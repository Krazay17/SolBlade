import { Object3D, Quaternion, Vector3 } from "three";
import GameScene from "../scenes/GameScene";
import HitData from "../core/HitData";
import MyEventEmitter from "../core/MyEventEmitter";
import { generateUUID } from "three/src/math/MathUtils.js";
import TouchData from "../core/TouchData";

export interface ActorData {
    type?: string;
    pos?: Vector3;
    rot?: Quaternion;
    health?: number;
    isRemote?: boolean;
    replicate?: boolean;
    active?: boolean
    [key: string]: any;
}

export default class Actor extends Object3D {
    scene: GameScene;
    data: any;
    actorType: string = '';
    replicate: boolean = false;
    isRemote: boolean = false;
    isDead: boolean = false;
    tempId: string;
    netId: string | null = null;
    owner: Actor | null = null;
    active: boolean = true;
    maxHealth: number = 100;
    lastHitData: HitData | null = null;
    _health: number = 100;
    targetPosition: Vector3 = new Vector3();
    constructor(scene: GameScene, data: ActorData = {}) {
        super();
        const {
            type = '',
            name = '',
            pos = new Vector3(),
            rot = new Quaternion(),
            maxHealth = 100,
            health = 100,
            isDead = false,
            isRemote = false,
            replicate = false,
            owner = null,
            netId = null,
            active = true,
        } = data;

        this.scene = scene;
        this.data = data;

        this.actorType = type
        this.name = name;
        this.position.copy(pos);
        this.setRotationFromQuaternion(rot);
        this.maxHealth = maxHealth;
        this._health = health;
        this.isDead = isDead;
        this.isRemote = isRemote;
        this.replicate = replicate;
        this.owner = owner;
        this.netId = netId;
        this.active = active;

        this.tempId = generateUUID();

        this.scene.graphics.add(this);

        if (this.isRemote) {
            this.targetPosition = this.position.clone();
        }
    }
    serialize() {
        return {
            ...this.data,
            owner: this.owner?.netId,
            tempId: this.tempId,
            type: this.actorType,
            name: this.name,
            pos: this.position.toArray(),
            rot: this.quaternion.toArray(),
            maxHealth: this.maxHealth,
            health: this._health,
            isDead: this.isDead,
            isRemote: this.isRemote,
            replicate: this.replicate,
            netId: this.netId,
            active: this.active,
        }
    }
    static deserialize(data: any, getActor: (id: string) => Actor | null) {
        let pos, rot, owner;

        if (Array.isArray(data.pos))
            pos = new Vector3().fromArray(data.pos);
        else if (data.pos && typeof data.pos === 'object')
            pos = new Vector3(data.pos.x, data.pos.y, data.pos.z);
        else
            pos = new Vector3();

        if (Array.isArray(data.rot))
            rot = new Quaternion().fromArray(data.rot);
        else if (data.rot && typeof data.rot === 'object')
            rot = new Quaternion(data.rot._x, data.rot._y, data.rot._z, data.rot._w);
        else
            rot = new Quaternion();

        if (typeof data.owner === 'string') {
            owner = getActor(data.owner);
        }

        return { ...data, pos, rot, owner };
    }
    setNetId(id: string) {
        this.netId = id;
    }
    destroy() {
        if (!this.active) return;
        this.active = false
        this.scene.graphics.remove(this);
        MyEventEmitter.emit('destroyActor', this);
    }
    activate(data: any) {
        this.active = true;
        this.data = { ...data };
        if (data.pos) this.position.copy(data.pos);
        this.scene.graphics.add(this);
        if (this.isRemote) return this;
        MyEventEmitter.emit('activateActor', { actor: this, data: this.data });
        return this;
    }
    update(dt: number, time: number) { };
    hit(data: HitData) {
        MyEventEmitter.emit('actorHit', data);
        console.log(data);
    }
    applyHit(data: HitData, health: number) {
        this.health = health;
        this.lastHitData = data;
        if (this.health <= 0) this.die(data.dealer);
    }
    touch(dealer: any) {
        MyEventEmitter.emit('actorTouch', new TouchData(dealer, this, this.active));
    }
    applyTouch(dealer: any) {
    }
    set health(amnt: number) {
        const clamped = Math.max(0, Math.min(this.maxHealth, amnt));
        if (clamped === this._health) return; // no change, no event
        this._health = clamped;
        this.healthChange(this._health);
    }
    healthChange(health: number) { }
    get health() {
        return this._health;
    }
    die(source: any = null) { 
        this.destroy();
    }
}