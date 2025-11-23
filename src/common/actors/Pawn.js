import RAPIER from "@dimforge/rapier3d-compat";
import Actor from "./Actor.js";
import { COLLISION_GROUPS } from "../config/SolConstants.js";
import Controller from "./components/Controller.js";
import { Vect3 } from "../utils/SolMath.js"
import SolWorld from "../SolWorld.js";

export default class Pawn extends Actor {
    /**
     * 
     * @param {SolWorld} world 
     * @param {*} data 
     */
    constructor(world, data = {}) {
        super(data);
        this.world = world;
        this.isRemote = false;
        this.height = data.height ?? 1;
        this.radius = data.radius ?? 0.5;

        /**@type {Controller} */
        this.controller = null;
        this.movement = null;
        this.fsm = null;
        this.abilities = null;
        this.body = null;
        this.collider = null;
    }
    get velocity() {
        if (!this.body) return;
        if (!this._vecVel) this._vecVel = new Vect3();

        return this._vecVel.copy(this.body.linvel());
    }
    set velocity(v) {
        if (!this.body) return;
        if (!this._vecVel) this._vecVel = new Vect3();
        this._vecVel.copy(v);
        this.body.setLinvel(this._vecVel, true)
    }
    get vecDir() {
        if (!this.body) return;
        if (!this._vecDir) this._vecDir = new Vect3();

        return this._vecDir.setFromRotArray(this.rot);
    }
    /**@param {RAPIER.World} world */
    makeBody(world, height = this.height, radius = this.radius) {
        const collideGroup = this.isRemote
            ? COLLISION_GROUPS.PLAYER << 16 | COLLISION_GROUPS.ENEMY
            : COLLISION_GROUPS.ENEMY << 16 | COLLISION_GROUPS.PLAYER
        const bDesc = RAPIER.RigidBodyDesc.dynamic();
        bDesc.setTranslation(this.pos[0], this.pos[1], this.pos[2]);
        bDesc.lockRotations();
        bDesc.setLinearDamping(0);
        bDesc.setAngularDamping(0);
        this.body = world.createRigidBody(bDesc)
        const cDesc = RAPIER.ColliderDesc.capsule(height, radius);
        this.collider = world.createCollider(cDesc, this.body);
        this.collider.setCollisionGroups(collideGroup);
        this.collider.setFriction(0);
        this.collider.setRestitution(0);
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
        if (this.movement) this.movement.update(dt);
        if (this.fsm) this.fsm.update(dt);
        if (this.animation) this.animation.update(dt);
        if (this.body) {
            if (this.isRemote) {
                this.graphics.position.lerp(this.body.translation(), dt * 60);
                this.graphics.quaternion.slerp(this.body.rotation(), dt * 60);
            } else {
                const pos = this.body.translation();
                const rot = this.body.rotation();
                this.vecPos = pos;
                this.quatRot = rot;
            }
        }
    }
    step(dt) {    }
    stateChanged(state) {    }
}