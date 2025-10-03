import AIController from "../core/AIController";
import AIMovement from "../core/AIMovement";
import NamePlate from "../core/Nameplate";
import StateManager from "../core/states/StateManager";
import GameScene from "../scenes/GameScene";
import Pawn from "./Pawn";
import * as THREE from "three";

export default class Enemy extends Pawn {
    stateManager: StateManager | null;
    constructor(scene: GameScene, pos: THREE.Vector3, meshName: string, radius: number = .5, height: number = 1,
        net: { isRemote: boolean, netId: string | null } = { isRemote: false, netId: null }) {
        super(scene, pos, meshName, radius, height, net);
        this.movement = new AIMovement(this);
        this.stateManager = new StateManager(this);
        this.controller = new AIController(scene, this);
        this.namePlate = new NamePlate(this, this.height/3 + 2);
    }
}