import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import Actor from "./Actor.js";
import { COLLISION_GROUPS } from "../config/SolConstants.js";
import Controller from "./components/Controller.js";
import { Vect3 } from "../utils/SolMath.js"
import SolWorld from "../core/SolWorld.js";

export default class Pawn extends Actor {
    /**
     * @param {SolWorld}world
     * @param {*} data
     */
    constructor(world, data = {}) {
        super(data);
        this.world = world;
        this.height = data.height ?? 1;
        this.radius = data.radius ?? 0.5;

        this.upVec = new THREE.Vector3(0, 1, 0);

        /**@type {Controller} */
        this.controller = null;
        this.movement = null;
        this.animation = null;
        this.fsm = null;
        this.abilities = null;
        this.body = null;
        this.collider = null;
    }
    get vecPos() {
        if (!this._vecPos) this._vecPos = new THREE.Vector3();
        return this._vecPos.fromArray(this.pos);
    }
    set vecPos(v) {
        if (!this._vecPos) this._vecPos = new THREE.Vector3();
        this._vecPos.copy(v);
        this.pos[0] = v.x;
        this.pos[1] = v.y;
        this.pos[2] = v.z;
    }
    /**@type {THREE.Quaternion} */
    get quatRot() {
        if (!this._quatRot) this._quatRot = new THREE.Quaternion();
        return this._quatRot.fromArray(this.rot);
    }
    /**@type {THREE.Quaternion} */
    set quatRot(v) {
        if (!this._quatRot) this._quatRot = new THREE.Quaternion();
        this._quatRot.copy(v);
        this.rot[0] = v.x;
        this.rot[1] = v.y;
        this.rot[2] = v.z;
        this.rot[3] = v.w;
    }
    get yaw() { return this._yaw }
    set yaw(v) {
        this._yaw = v;
        this.quatRot = this.quatRot.setFromAxisAngle(this.upVec, v)

        if (!this.body) return;
        this.body.setRotation(this.quatRot, true);
    }
    get velocity() {
        if (!this._vecVel) this._vecVel = new THREE.Vector3();

        if (!this.body) return;
        return this._vecVel.copy(this.body.linvel());
    }
    set velocity(v) {
        if (!this._vecVel) this._vecVel = new THREE.Vector3();
        this._vecVel.copy(v);

        if (!this.body) return;
        this.body.setLinvel(this._vecVel, true);
    }
    get vecDir() {
        if (!this._vecDir) this._vecDir = new Vect3();

        return this._vecDir.setFromRotArray(this.rot);
    }
    /**@param {RAPIER.World} world */
    makeBody(world, height = this.height, radius = this.radius) {
        const collideGroup = this.isRemote
            ? COLLISION_GROUPS.PLAYER << 16 | COLLISION_GROUPS.ENEMY
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
    /**@param {RAPIER.World} world */
    removeBody(world) {
        world.removeRigidBody(this.body);
        this.body = null;
        this.collider = null;
    }
    tick(dt) {
        if (!this.active) return;
        if (this.controller) this.controller.update(dt);
        if (this.animation) this.animation.update(dt);
        if (this.body) {
            if (this.fsm) this.fsm.update(dt);
            if (this.movement) this.movement.update(dt);
            //@ts-ignore
            this.vecPos = this.body.translation();
            //@ts-ignore
            this.quatRot = this.body.rotation();
        }
    }
    step(dt) { }
    stateChanged(state) { }
}