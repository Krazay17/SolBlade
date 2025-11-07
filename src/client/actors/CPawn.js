import AnimationManager from "../core/AnimationManager";
import MyEventEmitter from "../core/MyEventEmitter";
import CActor from "./CActor";
import PawnBody from "../core/PawnBody";
import Health from "../core/Health";

export default class CPawn extends CActor {
    constructor(game, data) {
        super(game, data);
        const {
            radius = .5,
            height = 1,
            skin = 'spikeMan',
        } = data;
        this.radius = radius;
        this.height = height;
        this.skin = skin;

        this.health = new Health(this, data.maxHealth, data.currentHealth)
        this.health.onChange = (v) => this.healthChange(v);

        this.pawnBody = new PawnBody(this.game.physicsWorld, this, this.pos, this.height, this.radius, this.isRemote);
        this.body = this.pawnBody.body;
        this.collider = this.pawnBody.collider;


        this.assignMesh(this.skin);

        MyEventEmitter.emit("pawnCreated", this);

        switch (this.type) {
            case 'player':
                this.interpSpeed = 60;
                break;
            default:
                this.interpSpeed = 20;
                break;
        }
    }
    set rotationY(v) { this.graphics.rotation.y = v }
    get rotationY() { return this.graphics.rotation.y };
    update(dt, time) {
        if (!this.active || this.destroyed) return;
        if (this.controller) this.controller.update?.(dt);
        if (this.stateManager) this.stateManager.update(dt, time);
        if (this.movement) this.movement.update?.(dt, time);
        if (this.animationManager) this.animationManager.update(dt);
        if (this.isRemote) this.graphics.quaternion.slerp(this.rot, this.interpSpeed * dt);
        if (this.pawnBody) this.graphics.position.lerp(this.pawnBody.position, this.interpSpeed * dt);
    }
    fixedUpdate(dt, time) {
        if (!this.active) return;
        if (this.isRemote) {
            if (this.pawnBody) {
                if (this.pawnBody.position.distanceToSquared(this.pos) > 50) {
                    this.pawnBody.position = this.pos;
                } else {
                    this.pawnBody.position = this.pawnBody.position.lerp(this.pos, this.interpSpeed * dt);
                }
            }
        } else {
            this.pos = this.pawnBody.position;
            this.rot = this.graphics.quaternion;
        }
    }
    async assignMesh(meshName) {
        const mesh = await this.game.meshManager?.createSkeleMesh(meshName);
        if (this.destroyed || !mesh) return false;
        if (this.mesh) {
            this.remove(this.mesh);
        }
        this.add(mesh);
        this.mesh = mesh;
        this.meshBody = mesh.meshBody;
        if (this.meshBody) this.meshBody.userData.owner = this;
        this.animationManager = new AnimationManager(this, this.meshBody ?? this.mesh, mesh.animations);
        this.skin = meshName;
        this.data.skin = meshName;

        return true;
    }
    touched(target) {
        console.log(target);
    }
    healthChange(health) {
        if (this.isRemote) {
            this.namePlate?.setHealth(health);
        }
        this.data.currentHealth = health;
    }
    hit(data) {
        if (!this.active) return;
        MyEventEmitter.emit('actorEvent', { id: this.id, event: "hit", data: data.serialize() });
        this.game.soundPlayer.playSound('hit');
    }
}