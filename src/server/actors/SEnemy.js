import SActor from "./SActor.js";
import SHealth from "../core/SHealth.js"
import SAIController from "../core/SAIController.js";
import { io } from "../SMain.js";
import { COLLISION_GROUPS } from '@solblade/shared/SolConstants.js';
import RAPIER from "@dimforge/rapier3d-compat";
import { randomPos } from "@solblade/shared";


export default class SEnemy extends SActor {
    constructor(game, data = {}) {
        data.name = data.name ?? 'Demon'
        super(game, data);

        const height = data.height || 1;
        const radius = data.radius || 0.5;
        this.speed = data.speed || 5;
        this.aggroRadius = data.aggroRadius || 250;
        this.turnSpeed = 10;
        this._rotation = 0;
        this.auth = true;

        /**@type {RAPIER.World} */
        this.physics = this.game.physics[this.sceneName];

        this.health = new SHealth(this, 100);
        this.health.onDeath = () => this.die();
        this.health.onChange = (a) => { this.data.currentHealth = a; };

        const collideGroup = (COLLISION_GROUPS.WORLD | COLLISION_GROUPS.PLAYER) << 16 | COLLISION_GROUPS.ENEMY;
        this.createCapsule(height, radius, collideGroup);
        this.aiController = new SAIController(this.game, this);

        this.stunned = false;
    }
    get position() { return this.body.translation() }
    get rotation() { return this._rotation }
    set rotation(r) { this._rotation = r }
    move(dir) {
        if (this.stunned) return;
        const velocity = { x: dir.x * this.speed, y: this.body.linvel().y, z: dir.z * this.speed };
        this.body.setLinvel(velocity, true);
    }
    die() {
        if (!this.active) return;
        this.deActivate();

        io.emit('actorEvent', { id: this.id, event: 'applyDie', data: this.serialize() });
        this.game.createActor('card', { pos: this.position, sceneName: this.sceneName });
    }
    update(dt) {
        if (!this.active) return;
        if (this.position.y < -50) return this.die();
        this.aiController.update(dt);
        this.pos = this.body.translation();

    }
    hit(data) {
        super.hit(data);
        this.health.subtract(data.amount);
        if (data.impulse) {
            if (this.body) this.body.setLinvel({ x: data.impulse[0], y: data.impulse[1], z: data.impulse[2] }, true);
            this.stunned = true;
            setTimeout(() => this.stunned = false, 600);
        }
    }
    createCapsule(height, radius, group) {
        /**@type {RAPIER.RigidBody} */
        this.body = this.physics.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
            .lockRotations()
            .setTranslation(this.pos.x || 0, this.pos.y || 0, this.pos.z || 0)
            .setLinearDamping(0.2)
            .setAngularDamping(0)
        );
        this.collider = this.physics.createCollider(RAPIER.ColliderDesc.capsule(height / 2, radius)
            .setCollisionGroups(group)
            .setActiveEvents(0)
            .setFriction(0)
            .setRestitution(0),
            this.body
        );
        this.collider.actor = this.id
    }
    activate() {
        this.body.setTranslation(randomPos(20, 10))
        this.pos = this.body.translation();
        this.health.current = this.health.maxHealth;
        super.activate()
    }
}