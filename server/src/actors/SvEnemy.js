import SvActor from "./SvActor.js";
import SvHealth from "../SvHealth.js"
import RAPIER from "@dimforge/rapier3d-compat";
import SrvAIController from "../SvAIController.js";
import { io } from "../../server.js";

const GROUPS = {
    WORLD: 0b0001,
    PLAYER: 0b0010,
    ENEMY: 0b0100,
};

export default class SvEnemy extends SvActor {
    constructor(actorManager, data = {}) {
        data.maxHealth = 100;
        super(actorManager, data);

        /**@type {RAPIER.World} */
        this.physics = this.actorManager.physics[data.solWorld];
        this.healthC = new SvHealth(this, data.maxHealth, data.health);
        this.healthC.onDeath = () => this.die();
        this.healthC.onChange = (a) => {
            this.data.health = a;
        }

        const height = data.height || 1;
        const radius = data.radius || 0.5;
        this._rotation = 0;
        // only collide with world and player
        const collideGroup = (GROUPS.WORLD | GROUPS.PLAYER) << 16 | GROUPS.ENEMY;

        /**@type {RAPIER.RigidBody} */
        this.body = this.physics.createRigidBody(RAPIER.RigidBodyDesc.dynamic()
            .lockRotations()
            .setTranslation(this.pos.x || 0, this.pos.y || 0, this.pos.z || 0)
            .setLinearDamping(0)
            .setAngularDamping(0)
        );
        this.collider = this.physics.createCollider(RAPIER.ColliderDesc.capsule(height / 2, radius)
            .setCollisionGroups(collideGroup)
            .setFriction(0)
            .setRestitution(0),
            this.body
        );
        this.aiController = new SrvAIController(this, actorManager);
        this.speed = data.speed || 5;
        this.aggroRadius = data.aggroRadius || 250;
        this.turnSpeed = 10;

        this.active = true;
        this.stunned = false;
    }
    get position() { return this.body.translation() }
    get rotation() { return this._rotation }
    set rotation(r) { this._rotation = r }
    move(dir) {
        const velocity = { x: dir.x * this.speed, y: this.body.linvel().y, z: dir.z * this.speed };
        this.body.setLinvel(velocity, true);
    }
    die() {
        this.actorManager.removeActor(this);
        this.physics.removeCollider(this.collider);
        this.active = false;
        io.emit('actorEvent', { id: this.netId, event: 'applyDie', data: this.serialize() });
        this.actorManager.createActor('item', { pos: this.position, solWorld: this.solWorld, doesRespawn: false });
    }
    update(dt) {
        if (!this.active) return;
        if (this.stunned) return;
        if (this.position.y < -50) return this.die();
        this.aiController.update(dt);
    }
    hit(data) {
        super.hit(data);
        if (data.impulse) {
            if (this.body) this.body.setLinvel({ x: data.impulse[0], y: data.impulse[1], z: data.impulse[2] }, true);
            this.stunned = true;
            setTimeout(() => this.stunned = false, 800);
        }
    }
}