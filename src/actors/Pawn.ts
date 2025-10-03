import * as THREE from "three";
import * as CANNON from 'cannon-es';
import GameScene from "../scenes/GameScene";
import Globals from "../utils/Globals";
import AnimationManager from "../core/AnimationManager";
import MyEventEmitter from "../core/MyEventEmitter";
import { getMaterial } from "../core/MaterialManager";
import StateManager from '../core/states/StateManager';
import PlayerStateManager from "../player/playerStates/PlayerStateManager";
import { threeVecToCannon } from "../utils/Utils";
import NamePlate from "../core/Nameplate";
import AIMovement from "../core/AIMovement";
import PlayerMovement from "../player/PlayerMovement";
import AIController from "../core/AIController";
import Actor from "./Actor";

export default class Pawn extends Actor {
    scene: GameScene;
    isRemote: boolean;
    body: CANNON.Body | null = null;
    radius: number;
    height: number;
    pawnName: string;
    targetPosition: THREE.Vector3 = new THREE.Vector3();
    targetRotation: number = 0;
    controller: AIController | null = null;
    movement: PlayerMovement | AIMovement | null = null;
    netId: string | null;
    mesh: THREE.SkinnedMesh | null = null;
    stateManager: StateManager | PlayerStateManager | null = null;
    animationManager: AnimationManager | null = null;
    namePlate: NamePlate | null = null;

    constructor(scene: GameScene, pos: THREE.Vector3, pawnName: string, radius: number = .5, height: number = 1,
        net: { isRemote: boolean, netId: string | null } = { isRemote: false, netId: null }) {
        super();
        this.scene = scene;
        this.radius = radius;
        this.height = height;
        this.pawnName = pawnName;
        pos.y += .2;
        this.position.copy(pos);

        this.isRemote = net.isRemote;
        this.netId = net.netId;
        Globals.graphicsWorld.add(this);

        this.assignMesh(pawnName);

        if (!this.isRemote) {
            this.body = this.createBody(new CANNON.Vec3(pos.x, pos.y, pos.z))
            scene.physics.addBody(this.body);
        } else {
            this.targetPosition.copy(pos);
        }
        MyEventEmitter.emit("pawnCreated", this);
    }
    destroy() {
        Globals.graphicsWorld.remove(this);
        if (this.body) Globals.physicsWorld.removeBody(this.body);
    }
    update(dt: number, time: number) {
        if (this.controller) this.controller.update?.(dt);
        if (this.stateManager) this.stateManager.update(dt, time);
        if (this.animationManager) this.animationManager.update(dt);
        if (!this.isRemote) {
            if (this.body) {
                this.position.copy(this.body.position);
            }
        } else {
            if (this.body) {
                this.body.position.copy(threeVecToCannon(this.position));
            }
            if (this.position.distanceToSquared(this.targetPosition) > 2) {
                this.position.copy(this.targetPosition);
            } else {
                this.position.lerp(this.targetPosition, 60 * dt);
            }
            if (Math.abs(this.rotation.y - this.targetRotation) > 5) {
                this.rotation.y = this.targetRotation;
            } else {
                this.rotation.y += (this.targetRotation - this.rotation.y) * 60 * dt;
            }
        }
    }
    async assignMesh(pawnName: string) {
        const mesh = await this.scene.meshManager?.createSkeleMesh(pawnName);
        if (!mesh) return;
        this.add(mesh);
        console.log(mesh);
        this.mesh = mesh.meshBody as THREE.SkinnedMesh;
        this.mesh.userData.owner = this;
        this.animationManager = new AnimationManager(this.mesh, mesh.animations);
        this.scene.addEnemyMesh(this.mesh);
        this.meshAssigned();
        MyEventEmitter.emit('newPawnMesh', this.mesh);
    }
    meshAssigned() { }
    createBody(pos: CANNON.Vec3) {
        const material = getMaterial('pawnMaterial');
        const shape = new CANNON.Sphere(this.radius);
        const shape2 = new CANNON.Cylinder(this.radius, this.radius, this.height, 8);
        const body = new CANNON.Body({
            shape: shape,
            position: pos,
            mass: 1,
            material: material,
            fixedRotation: true,
            collisionFilterGroup: 2,
            collisionFilterMask: -1,
        });
        body.addShape(shape2, new CANNON.Vec3(0, this.height / 2, 0));

        if (!this.scene.levelLoaded) {
            body.sleep();
            MyEventEmitter.once('levelLoaded', () => {
                body.wakeUp();
            });
        }
        return body;
    }
    takeDamage(actor: any, damage: any) {
        console.log(damage.amount);
    }
    getMeshBody() {
        return this.mesh;
    }
}