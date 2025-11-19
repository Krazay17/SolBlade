import { COLLISION_GROUPS, randomPos } from "@solblade/shared";
import SHealth from "../core/SHealth.js";
import SActor from "./SActor.js";
import RAPIER from "@dimforge/rapier3d-compat";
import SAIController from "../core/SAIController.js";

export default class SPawn extends SActor {
    constructor(game, data) {
        super(game, data);
        this.fsm = null;
        /**@type {SAIController} */
        this.controller = null;
        this.movement = null;

        /**@type {RAPIER.World} */
        this.physics = this.game.physics[this.sceneName];

        this.health = new SHealth(this, 100);
        this.health.onDeath = () => this.die();
        this.health.onChange = (a) => { this.data.currentHealth = a; };

        const height = data.height || 1;
        const radius = data.radius || 0.5;
        const collideGroup = (COLLISION_GROUPS.WORLD | COLLISION_GROUPS.PLAYER) << 16 | COLLISION_GROUPS.ENEMY;
        const { body, collider } = this.createCapsule(height, radius, collideGroup);
        this.body = body;
        this.collider = collider;

        console.log(this.id, this.type, this.collider.actor);

        this.anim = null;
    }
    get position() { return this.body.translation() }
    get yaw() { return this._yaw }
    set yaw(v) {
        this._yaw = v;
        const half = v * 0.5;
        this.rot = {
            x: this.rot.x || 0,
            y: Math.sin(half),
            z: this.rot.z || 0,
            w: Math.cos(half),
        };
    }
    update(dt, time) {
        if (!this.active) return;
        super.update(dt);
        if (this.fsm) this.fsm.update(dt);
        if (this.controller) this.controller.update(dt, time);
        if (this.movement) this.movement.update(dt, time);
        if (this.auth) {
            this.pos = this.body.translation();
        } else {
            const posObj =
                Array.isArray(this.pos)
                    ? { x: this.pos[0], y: this.pos[1], z: this.pos[2] }
                    : { x: this.pos.x, y: this.pos.y, z: this.pos.z }
            this.body.setTranslation(posObj, true);
        }
    }
    die() {
        if (!this.active) return;
        this.deActivate();

        this.game.io.emit('actorEvent', { id: this.id, event: 'applyDie', data: this.serialize() });
        this.game.createActor('card', { pos: this.position, sceneName: this.sceneName });
    }
    setState(state, params) {
        this.fsm.setState(state, params);
    }
    createCapsule(height, radius, group) {
        /**@type {RAPIER.RigidBody} */
        const body = this.physics.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
            .lockRotations()
            .setTranslation(this.pos.x || 0, this.pos.y || 0, this.pos.z || 0)
            .setLinearDamping(0.2)
            .setAngularDamping(0)
        );
        const collider = this.physics.createCollider(RAPIER.ColliderDesc.capsule(height / 2, radius)
            .setCollisionGroups(group)
            .setActiveEvents(0)
            .setFriction(0)
            .setRestitution(0),
            body
        );
        collider.actor = this.id

        return { body, collider };
    }
    activate() {
        this.body.setTranslation(randomPos(20, 10))
        this.pos = this.body.translation();
        this.health.current = this.health.maxHealth;
        super.activate()
    }
    setAnim(anim) {
        if (this.anim !== anim) {
            this.anim = anim;
            this.game.io.emit('pawnAnim', { id: this.id, anim: this.anim });
        }
    }
}