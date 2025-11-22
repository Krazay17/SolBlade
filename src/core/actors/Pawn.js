import RAPIER from "@dimforge/rapier3d-compat";
import GameCore from "../GameCore.js";
import Actor from "./Actor.js";
import { COLLISION_GROUPS } from "../SolConstants.js";
import Controller from "./components/Controller.js";

export default class Pawn extends Actor {
    /**
     * 
     * @param {GameCore} game 
     * @param {*} data 
     */
    constructor(game, data = {}) {
        super(data);
        this.game = game;
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
    step(dt) { }
    stateChanged(state){
        
    }
}