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
import Game from "../Game";
import { lerpAngle } from "../utils/Utils";

export default class Pawn extends ClientActor {
    body: PawnBody | null;
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
    yaw: number;

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
        this.yaw = this.rot.y;

        this.body = new PawnBody(this.game.physicsWorld, this, data.pos, this.height, this.radius, data.isRemote);

        this.assignMesh(this.skin);

        if (!this.isRemote) {
        } else {
            this.targetPosition = data.pos;
        }
        MyEventEmitter.emit("pawnCreated", this);
    }
    get position() { return this.body?.position }
    get rotationY() { return this.yaw }
    set rotationY(v) { this.graphics.rotation.y = v }
    set quatY(r: number) {
        this.yaw = r;
        const yaw = r;
        const halfYaw = yaw * 0.5;
        const sin = Math.sin(halfYaw);
        const cos = Math.cos(halfYaw);

        const q = { x: this.rot.x, y: sin, z: this.rot.z, w: cos };
        // const len = Math.hypot(q.x, q.y, q.z, q.w);
        // q.x /= len; q.y /= len; q.z /= len; q.w /= len;

        // this.rot.copy(q);
        //this.body.body.setRotation(q, true);
        this.graphics.quaternion.copy(q);
        //this.graphics.rotation.y = r;

        if (this.isRemote) return;
        MyEventEmitter.emit('playerRotation', q);
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
    hit(data: any) {
        console.log(data)
    }
    healthChange(health: number): void {
        if (this.isRemote) {
            this.namePlate?.setHealth(health);
        }
    }
    getMeshBody() {
        return this.meshBody;
    }
}