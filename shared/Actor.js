import { Object3D, Quaternion, Vector3 } from "three";
import { generateUUID } from "three/src/math/MathUtils.js";
import HitData from "./HitData.js";
import MyEventEmitter from "./MyEventEmitter.js";

export default class Actor {
    constructor(game, data = {}) {
        const {
            type = '',
            name = '',
            solWorld = 'world1',
            pos = new Vector3(),
            rot = new Quaternion(),
            maxHealth = 100,
            health = 100,
            isRemote = false,
            replicate = false,
            owner = null,
            netId = null,
            active = true,
        } = data;

        this.game = game;
        this.world = game.world;
        this.data = data;

        this.graphics = new Object3D();
        this.game.graphics?.add(this.graphics);
        this.graphics.name = name;
        this.position.copy(pos);
        this.setRotationFromQuaternion(rot);

        this.type = type
        this.name = name;
        this.solWorld = solWorld;
        this.lastWorld = solWorld;
        this.team = team;
        this.maxHealth = maxHealth;
        this._health = health;
        this.isDead = isDead;
        this.isRemote = isRemote;
        this.replicate = replicate;
        this.owner = owner;
        this.netId = netId;
        this.active = active;

        this.tempId = generateUUID();


        if (this.isRemote) {
            this.targetPosition = this.position.clone();
        }
    }
    get position() { return this.graphics.position }
    get rotation() { return this.graphics.rotation }
    get scale() { return this.graphics.scale }
    set rotation({ x, y, z }) { this.graphics.rotation.set(x, y, z) }
    get quaternion() { return this.graphics.quaternion }
    set health(amnt) {
        const clamped = Math.max(0, Math.min(this.maxHealth, amnt));
        if (clamped === this._health) return; // no change, no event
        this._health = clamped;
        this.healthChange(this._health);
    }
    healthChange(health) { }
    get health() {
        return this._health;
    }
    get scene() {
        return this.game;
    }

    setRotationFromQuaternion(rot) { this.graphics.setRotationFromQuaternion(rot) }
    remove(obj) { this.graphics.remove(obj) }
    add(obj) { this.graphics.add(obj) }
    update(dt, time) { };
    fixedUpdate(dt, time) { };

    serialize() {
        return {
            ...this.data,
            solWorld: this.solWorld,
            team: this.team,
            owner: this.owner?.netId,
            tempId: this.tempId,
            type: this.type,
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
    static deserialize(data, getActor) {
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
    setNetId(id) {
        this.netId = id;
    }
    activate(data) {
        this.active = true;
        if (!data) return;
        this.data = { ...this.data, ...data };
        if (data.pos) this.position.copy(data.pos);
        if (data.rot) this.setRotationFromQuaternion(data.rot);
        if (data.health !== undefined) this.health = data.health;
        if (data.isDead !== undefined) this.isDead = data.isDead;
        if (data.isRemote !== undefined) this.isRemote = data.isRemote;

        this.game.graphics?.add(this.graphics);

        if (!this.isRemote) MyEventEmitter.emit('newActor', this);
    }
    stateUpdate(data) {
        console.log(data);
    }
    deActivate() {
        this.active = false;
        this.game.graphics?.remove(this.graphics);
    }
    destroy() {
        this.active = false;
        this.destroyed = true;
        this.game.graphics?.remove(this.graphics);
        this.game.actorManager?.removeActor(this);
        this.tempId = '';
        this.netId = '';
    }
    hit(data) {
        console.log(data);
        MyEventEmitter.emit('actorHit', data);
        this.game.soundPlayer.playSound('hit');
        this.onHit(data);
    }
    applyHit(data) {
        const { dealer, type, impulse, stun, dim, dur, sound, hitPosition, amount } = data;
        if (sound) {
            this.game.soundPlayer.applyPosSound(sound, hitPosition);
        }
        if (data) this.lastHitData = data;
        this.onHit(data);
    }
    onHit(data) {    }
}