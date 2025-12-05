import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { SkeletonUtils } from "three/examples/jsm/Addons";

class LoadingBar {
    update(url, loaded, total) {
        //console.log(url, loaded, total);
    }
    finish() {
        //console.log("Finish Load!");
    }
}

class MeshManager {
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

export class SolLoading {
    constructor() {
        this.loadingBar = new LoadingBar();
        this.manager = new THREE.LoadingManager(this.loadingBar.finish, this.loadingBar.update)
        this.glLoader = new GLTFLoader(this.manager)
        this.textureLoader = new THREE.TextureLoader(this.manager);
        this.meshManager = new MeshManager(this.glLoader)
    }
}