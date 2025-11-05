import * as THREE from "three";
import AnimationManager from "../core/AnimationManager";
import MyEventEmitter from "../core/MyEventEmitter";
import StateManager from '../core/states/StateManager';
import PlayerStateManager from "../player/playerStates/PlayerStateManager";
import NamePlate from "../core/Nameplate";
import AIMovement from "../core/AIMovement";
import PlayerMovement from "../player/PlayerMovement";
import AIController from "../core/AIController";
import ClientActor from "./ClientActor";
import RAPIER from "@dimforge/rapier3d-compat";
import PawnBody from "../core/PawnBody";
import Game from "../CGame";
import Health from "../core/Health";

export default class Pawn extends ClientActor {
    collider: RAPIER.Collider | null = null;
    radius: number;
    height: number;
    targetRotation: number = 0;
    controller: AIController | null = null;
    movement: PlayerMovement | AIMovement | null = null;
    skin: string;
    mesh: THREE.Group | null = null;
    meshBody: THREE.SkinnedMesh | null = null;
    stateManager: StateManager | PlayerStateManager | null = null;
    animationManager: AnimationManager | null = null;
    namePlate: NamePlate | null = null;
    targetPosition: THREE.Vector3 = new THREE.Vector3();
    _quatY: number;
    health: Health;

    constructor(game: Game, data: any) {
        super(game, data);
        const {
            radius = .5,
            height = 1,
            skin = 'spikeMan',
        } = data;
        this.radius = radius;
        this.height = height;
        this.skin = skin;
        this._quatY = this.rot.y;

        this.health = new Health(this, data.maxHealth, data.currentHealth)
        this.health.onChange = (v: number) => this.healthChange(v);

        this.body = new PawnBody(this.game.physicsWorld, this, this.pos, this.height, this.radius, this.isRemote);

        this.assignMesh(this.skin);

        MyEventEmitter.emit("pawnCreated", this);
    }
    get velocity() { return this.body.velocity }
    get position() { return this.body?.position }
    set rotationY(v) { this.graphics.rotation.y = v }
    get rotationY() { return this.graphics.rotation.y };
    get quatY() { return this._quatY }
    set quatY(r: number) {
        this._quatY = r;
        const yaw = r;
        const halfYaw = yaw * 0.5;
        const sin = Math.sin(halfYaw);
        const cos = Math.cos(halfYaw);
        const q = { x: this.rot.x, y: sin, z: this.rot.z, w: cos };

        this.graphics.quaternion.copy(q);

        if (this.isRemote) return;
        MyEventEmitter.emit('playerRotation', q);
    }
    setId(id: string) {
        this.id = id;
        this.body.collider.actor = id;
    }
    update(dt: number, time: number) {
        super.update(dt, time);
        if (!this.active || this.destroyed) return;
        if (this.controller) this.controller.update?.(dt);
        if (this.stateManager) this.stateManager.update(dt, time);
        if (this.movement) this.movement.update?.(dt, time);
        if (this.animationManager) this.animationManager.update(dt);
        if (this.isRemote) {
            this.graphics.quaternion.slerp(this.rot, 60 * dt);
        }
        if (this.body) this.graphics.position.copy(this.body.position);
    }
    fixedUpdate(dt: number, time: number): void {
        if (this.isRemote) {
            if (this.body) {
                if (this.body.position.distanceToSquared(this.pos) > 50) {
                    this.body.position = this.pos;
                } else {
                    this.body.position = this.body.position.lerp(this.pos, 60 * dt);
                }
            }
        } else {
            this.pos = this.body.position;
            this.rot = this.graphics.quaternion;
        }
    }
    destroy(): void {
        super.destroy();
        if (this.body?.body) this.game.physics.safeRemoveBody(this.body.body);
        if (this.collider) this.game.physics.safeRemoveCollider(this.collider);
        this.body = null;
        this.collider = null;
    }
    async assignMesh(meshName: string) {
        const mesh = await this.game.meshManager?.createSkeleMesh(meshName);
        if (this.destroyed || !mesh) return false;
        if (this.mesh) {
            this.remove(this.mesh);
        }
        this.add(mesh);
        this.mesh = mesh;
        this.meshBody = mesh.meshBody as THREE.SkinnedMesh;
        if (this.meshBody) this.meshBody.userData.owner = this;
        this.animationManager = new AnimationManager(this, this.meshBody ?? this.mesh, mesh.animations);
        this.skin = meshName;
        this.data.skin = meshName;

        return true;
    }
    touched(target: any) {
        console.log(target);
    }
    healthChange(health: number): void {
        if (this.isRemote) {
            this.namePlate?.setHealth(health);
        }
        this.data.currentHealth = health;
    }
}