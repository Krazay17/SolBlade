import { SkeletonUtils } from "three/examples/jsm/Addons";
import { GLTFLoader } from "three/examples/jsm/Addons.js";

export default class MeshManager {
    /**
     * 
     * @param {GLTFLoader} glbLoader 
     */
    constructor(glbLoader) {
        this.loader = glbLoader;
        this.loadedMesh = new Map();
    }
    async makeMesh(name) {
        let loadedMesh = this.loadedMesh.get(name);
        if (!loadedMesh) {
            const gltf = await this.loader.loadAsync(`assets/${name}.glb`)
            gltf.scene.position.set(0, -1, 0);
            loadedMesh = {
                mesh: gltf.scene,
                animations: gltf.animations
            }
            this.loadedMesh.set(name, loadedMesh);
        }
        let result = {
            mesh: SkeletonUtils.clone(loadedMesh.mesh),
            animations: loadedMesh.animations
        };
        return result;
    }
}