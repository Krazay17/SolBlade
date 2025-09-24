import * as THREE from "three";
import * as CANNON from 'cannon-es';
import GameScene from "../scenes/GameScene";
import Globals from "../utils/Globals";

export default class Pawn extends THREE.Object3D {
    scene: GameScene;
    isRemote: boolean;
    netId: string | null;
    mesh: THREE.SkinnedMesh | null = null;
    constructor(scene: GameScene, pos: THREE.Vector3, meshName: string,
        net: { isRemote: boolean, netId: string | null } = { isRemote: false, netId: null }) {
        super();
        this.position.copy(pos);
        this.scene = scene;
        this.mesh = null;

        this.isRemote = net.isRemote;
        this.netId = net.netId;
        this.assignMesh(meshName);
        Globals.graphicsWorld.add(this);
    }

    assignMesh(meshName: string) {
        this.scene.meshManager?.loadSkeleMesh(meshName).then((m) => {
            if (m) {
                this.mesh = m.model.children[0] as THREE.SkinnedMesh;
                this.add(m.model);
            }
        });
    }
}