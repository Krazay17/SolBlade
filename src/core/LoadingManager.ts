import * as THREE from 'three'
import { DRACOLoader, GLTFLoader } from 'three/examples/jsm/Addons.js'

export default class LoadingManager {
    textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
    gltfLoader: GLTFLoader = new GLTFLoader();
    loadingBarContainer: HTMLElement | null = null;
    loadingBarFill: HTMLElement | null = null;
    dracoLoader: DRACOLoader = new DRACOLoader();
    constructor() {

        if (this.gltfLoader) {
            // Loading progress bar could be added here using the onProgress callback
            this.gltfLoader.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
                // console.log(`Loading file: ${url}`);
                const progress = Math.round((itemsLoaded / itemsTotal) * 10000) / 100;
                this.loadingBar(progress);
            };
            this.gltfLoader.manager.onLoad = () => {
                this.loadingBar(100);
            };
        }
    }
    loadingBar(progress: number) {
        if (!this.loadingBarContainer) {
            this.loadingBarContainer = document.createElement('div');
            this.loadingBarContainer.id = 'loadingBarContainer';
            this.loadingBarContainer.style.position = 'absolute';
            this.loadingBarContainer.style.top = '10%';
            this.loadingBarContainer.style.left = '50%';
            this.loadingBarContainer.style.transform = 'translate(-50%, -50%)';
            this.loadingBarContainer.style.width = '50%';
            this.loadingBarContainer.style.height = '30px';
            this.loadingBarContainer.style.backgroundColor = '#555';
            this.loadingBarContainer.style.border = '2px solid #000';
            document.body.appendChild(this.loadingBarContainer);
        }

        if (!this.loadingBarFill) {
            this.loadingBarFill = document.createElement('div');
            this.loadingBarFill.id = 'loadingBar';
            this.loadingBarFill.style.backgroundColor = '#0f0';
            this.loadingBarContainer.appendChild(this.loadingBarFill);
            this.loadingBarFill.style.height = '100%';
            this.loadingBarFill.style.width = '0%';
            this.loadingBarFill.style.zIndex = '1000';
        }
        this.loadingBarFill.style.width = `${progress}%`;
        if (progress >= 100) {
            setTimeout(() => {
                if (this.loadingBarContainer) {
                    document.body.removeChild(this.loadingBarContainer);
                    this.loadingBarContainer = null;
                    this.loadingBarFill = null;
                }
            }, 500); // wait a bit before removing
        }

    }
}