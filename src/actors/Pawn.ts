import * as THREE from "three";
import World from "../scenes/World";
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
import { lerp } from "three/src/math/MathUtils.js";

export default class Pawn extends Actor {
    body: PawnBody | null = null;
    collider: RAPIER.Collider | null = null;
    radius: number;
    height: number;
    meshName: string;
    targetRotation: number = 0;
    controller: AIController | null = null;
    movement: PlayerMovement | AIMovement | null = null;
    mesh: THREE.SkinnedMesh | null = null;
    stateManager: StateManager | PlayerStateManager | null = null;
    animationManager: AnimationManager | null = null;
    namePlate: NamePlate | null = null;

    constructor(
        game: Game,
        data: any,
        meshName: string,
        radius: number = .5,
        height: number = 1
    ) {
        super(game, data);
        this.radius = radius;
        this.height = height;
        this.meshName = meshName;

        this.assignMesh(meshName);

        if (!this.isRemote) {
            if (this.game.physics) this.body = new PawnBody(this.game.physics, data.pos, height, radius);
        } else {
            this.targetPosition = data.pos;
        }
        MyEventEmitter.emit("pawnCreated", this);
    }
    update(dt: number, time: number) {
        super.update(dt, time);
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
            if (this.position.distanceToSquared(this.targetPosition) > 25) {
                this.position.copy(this.targetPosition);
            } else {
                this.position.lerp(this.targetPosition, 60 * dt);
            }

            this.rotation.y = lerp(this.rotation.y, this.targetRotation, 60 * dt);
        }
    }
    async assignMesh(meshName: string) {
        const mesh = await this.scene.meshManager?.createSkeleMesh(meshName);
        if (!mesh) return;
        this.add(mesh);
        this.mesh = mesh.meshBody as THREE.SkinnedMesh;
        this.mesh.userData.owner = this;
        this.animationManager = new AnimationManager(this, this.mesh, mesh.animations);
        this.meshAssigned();
        MyEventEmitter.emit('newPawnMesh', this.mesh);
    }
    meshAssigned() { }
    getMeshBody() {
        return this.mesh;
    }
}