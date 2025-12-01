import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import LoadingBar from "./LoadingBar.js";
import MeshManager from "./MeshManager.js";
export class SolLoading {
    constructor(){
        this.loadingBar = new LoadingBar();
        this.manager = new THREE.LoadingManager(this.loadingBar.finish, this.loadingBar.update)
        this.glLoader = new GLTFLoader(this.manager)
        this.textureLoader = new THREE.TextureLoader(this.manager);
        this.meshManager = new MeshManager(this.glLoader)
    }
}