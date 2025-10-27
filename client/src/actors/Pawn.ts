import * as THREE from "three";
import AnimationManager from "../core/AnimationManager";
import MyEventEmitter from "../core/MyEventEmitter";
import StateManager from '../core/states/StateManager';
import PlayerStateManager from "../player/playerStates/PlayerStateManager";
import NamePlate from "../core/Nameplate";
import AIMovement from "../core/AIMovement";
import PlayerMovement from "../player/PlayerMovement";
import AIController from "../core/AIController";
import Actor from "./Actor";
import RAPIER from "@dimforge/rapier3d-compat";
import PawnBody from "../core/PawnBody";
import Game from "../Game";
import { lerpAngle } from "../utils/Utils";

export default class Pawn extends Actor {
    body: PawnBody | null = null;
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

    constructor(
        game: Game,
        data: any
    ) {
        super(game, data);
        this.radius = data.radius ?? .5;
        this.height = data.height ?? 1;
        this.skin = data.skin ?? 'spikeMan';

        this.assignMesh(this.skin);

        if (this.game.physics && !this.destroyed) this.body = new PawnBody(this.game.physics, data.pos, this.height, this.radius, data.isRemote);
        if (!this.isRemote) {
        } else {
            this.targetPosition = data.pos;
        }
        MyEventEmitter.emit("pawnCreated", this);
    }
    update(dt: number, time: number) {
        super.update(dt, time);
        if (!this.active) return;
        if (this.controller) this.controller.update?.(dt);
        if (this.stateManager) this.stateManager.update(dt, time);
        if (this.movement) this.movement.update?.(dt, time);
        if (this.animationManager) this.animationManager.update(dt);
        if (!this.isRemote) {
            if (this.body) {
                this.position.copy(this.body.position);
            }
        } else {
            // Remote Player
            if (this.body) {
                this.body.position = this.position;
            }
            if (this.position.distanceToSquared(this.targetPosition) > 50) {
                this.position.copy(this.targetPosition);
            } else {
                this.position.lerp(this.targetPosition, 60 * dt);
            }
            this.rotation.y = lerpAngle(this.rotation.y, this.targetRotation, 60 * dt)
            //this.rotation.y = lerp(this.rotation.y, this.targetRotation, 60 * dt);
        }
    }
    destroy(): void {
        super.destroy();
        if (this.body?.body) this.game.physics.removeRigidBody(this.body.body)
        if (this.collider) this.game.physics.removeCollider(this.collider, true);
    }
    async assignMesh(meshName: string) {
        const mesh = await this.scene.meshManager?.createSkeleMesh(meshName);
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
    healthChange(health: number): void {
        if (this.isRemote) {
            this.namePlate?.setHealth(health);
        }
    }
    getMeshBody() {
        return this.meshBody;
    }


}