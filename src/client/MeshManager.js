import { SkeletonUtils } from "three/examples/jsm/Addons";
import CGame from "./CGame";

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
        const loadedMesh = this.loadedMesh.get(name);
        let mesh;
        if (loadedMesh) {
            mesh = SkeletonUtils.clone(loadedMesh);
        } else {
            mesh = await this._newMesh(name);
        }
        return mesh;
    }
    async _newMesh(name) {
        let mesh = await this.loader.loadAsync(`assets/${name}.glb`)
        console.log(mesh);
        
        this.loadedMesh.set(name, mesh);
        return mesh;
    }
}