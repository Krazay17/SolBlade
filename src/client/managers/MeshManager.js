import { SkeletonUtils } from "three/examples/jsm/Addons";
import CGame from "../core/CGame";

export default class MeshManager {
    /**
     * 
     * @param {CGame} game 
     */
    constructor(game) {
        this.game = game;
        this.loader = this.game.glbLoader;

        this.loadedMesh = new Map();
    }
    async makeMesh(name) {
        let mesh = {};
        const loadedMesh = this.loadedMesh.get(name);
        if (loadedMesh) {
            mesh.scene = SkeletonUtils.clone(loadedMesh.scene);
            mesh.animations = loadedMesh.animations;
        } else {
            mesh = await this._newMesh(name);
        }
        return mesh;
    }
    async _newMesh(name) {
        let mesh = await this.loader.loadAsync(`assets/${name}.glb`)

        this.loadedMesh.set(name, mesh);
        return mesh;
    }
}