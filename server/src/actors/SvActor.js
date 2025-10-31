import { io } from "../../server.js";
import { randomPos } from "../ActorDefaults.js";
import ActorManager from "../SvActorManager.js";
import SvHealth from "../SvHealth.js";
import RAPIER from "@dimforge/rapier3d-compat";

export default class SvActor {
    constructor(actorManager, data = {
        netId: '',
        type: '',
        name: '',
        solWorld: 'world0',
        pos: { x: 0, y: 1, z: 0 },
    }) {
        /**@type {ActorManager} */
        this.actorManager = actorManager;
        this.data = data;

        this.netId = data.netId;
        this.type = data.type;
        this.name = data.name;
        this.solWorld = data.solWorld;
        this.pos = data.pos;

        this.active = true;

        /**@type {RAPIER.World} */
        this.physics = this.actorManager.physics[this.solWorld];

        this.body = null;
        this.collider = null;

        this.healthC = new SvHealth(this, data.maxHealth, data.health);
        this.healthC.onDeath = () => this.die();
        this.healthC.onChange = (val) => this.data.health = val;

        this.lastHit = null;
    }
    serialize() {
        const data = {
            ...this.data,
            netId: this.netId,
            type: this.type,
            name: this.name,
            solWorld: this.solWorld,
            pos: this.pos,
        }
        return data;
    }
    hit(data) {
        this.healthC.subtract(data.amount);
        this.lastHit = data;
        io.emit('actorHit', data);
    }
    die() {
        this.active = false;
        io.emit('actorDie', { id: this.netId, data: this.lastHit });
    }
    destroy() {
        this.actorManager.removeActor(this);
    }
    respawn(time, pos) {
        if (!pos) pos = randomPos(20, 10);
        setTimeout(() => {
            this.actorManager.createActor(this.type, { ...this.data, pos });
        }, time);
    }
    createCapsule(height, radius, group) {
        /**@type {RAPIER.RigidBody} */
        this.body = this.physics.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
            .lockRotations()
            .setTranslation(this.pos.x || 0, this.pos.y || 0, this.pos.z || 0)
            .setLinearDamping(0)
            .setAngularDamping(0)
        );
        this.collider = this.physics.createCollider(RAPIER.ColliderDesc.capsule(height / 2, radius)
            .setCollisionGroups(group)
            .setFriction(0)
            .setRestitution(0),
            this.body
        );
    }
}