import { Object3D, Quaternion, Vector3 } from "three";
import HitData from "../core/HitData";
import MyEventEmitter from "../core/MyEventEmitter";
import { generateUUID } from "three/src/math/MathUtils.js";
import TouchData from "../core/TouchData";
import Game from "../Game.js";
import World from "../scenes/World.js";

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
    game: Game;
    world: World;
    solWorld: string;
    team: string;
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
    constructor(game: Game, data: ActorData = {}) {
        super();
        const {
            type = '',
            name = '',
            solWorld = '',
            team = 'A',
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

        this.game = game;
        this.world = game.world;
        this.data = data;

        this.actorType = type
        this.name = name;
        this.solWorld = solWorld;
        this.team = team;
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

        this.game.graphics?.add(this);

        if (this.isRemote) {
            this.targetPosition = this.position.clone();
        }
    }
    update(dt: number, time: number) { };
    serialize() {
        return {
            ...this.data,
            solWorld: this.solWorld,
            team: this.team,
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
    activate(data: any) {
        this.active = true;
        this.data = { ...this.data, ...data };
        if (data.pos) this.position.copy(data.pos);
        if (data.rot) this.setRotationFromQuaternion(data.rot);
        if (data.health !== undefined) this.health = data.health;
        if (data.isDead !== undefined) this.isDead = data.isDead;
        if (data.isRemote !== undefined) this.isRemote = data.isRemote;

        this.game.graphics?.add(this);

        if (!this.isRemote) MyEventEmitter.emit('newActor', this);
    }
    deActivate() {
        this.active = false;
        this.game.graphics?.remove(this);
    }
    destroy() {
        this.active = false
        this.game.graphics?.remove(this);
        this.game.actorManager?.removeActor(this);
    }
    hit(data: HitData) {
        console.log(data);
        MyEventEmitter.emit('actorHit', data);
        this.game.soundPlayer.playSound('hit');
        this.onHit(data);
    }
    applyHit(data: HitData, health: number) {
        const { dealer, type, impulse, stun, dim, dur, sound, hitPosition, amount } = data;
        this.health = health ?? this.health + amount;
        if (sound) {
            this.game.soundPlayer.applyPosSound(sound, hitPosition);
        }

        if (data) this.lastHitData = data;
        if (this.health <= 0) this.die(this.lastHitData);
        this.onHit(data);
    }
    onHit(data: any) {

    }
    touch(dealer: any) {
        MyEventEmitter.emit('actorTouch', new TouchData(dealer, this));
        this.onTouch(dealer);
    }
    applyTouch(data: any) {
        this.onTouch(data.dealer || null);
    }
    onTouch(dealer: any) {
        this.deActivate();
    }
    die(data: HitData | null) {
        MyEventEmitter.emit('actorDie', data || new HitData({ target: this }));
        this.onDie(data);
    }
    applyDie(data: HitData | null) {
        this.onDie(data);
    }
    onDie(data: any) {
        this.deActivate();
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
    get scene() {
        return this.game;
    }
}