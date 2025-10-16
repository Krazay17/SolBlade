import * as THREE from 'three';
import Globals from '../utils/Globals';

export default class SkyBox extends THREE.Object3D {
    constructor(scene) {
        super();
        this.scene = scene;
        this.active = true;
        this.textureLoader = scene.loadingManager.textureLoader;
        this.sky = this.createSky();
        this.rotatingFilter1 = this.createRotatingFilter('assets/SkyFilter.webp', 2400);
        this.rotatingFilter2 = this.createRotatingFilter('assets/SkyFilter2.webp', 2300);

        this.scene.add(this);
    }
    destroy() {
        this.active = false;
        this.scene.remove(this);
        this.textureLoader = null;
        this.sky = null;
        this.rotatingFilter1 = null;
        this.rotatingFilter2 = null;
        this.scene = null;
    }

    createSky() {
        const geometry = new THREE.SphereGeometry(2500);
        const myTexture = this.textureLoader.load('assets/RedSky0.webp');
        const myMaterial = new THREE.MeshBasicMaterial({
            map: myTexture,
            side: THREE.BackSide,
        });
        const skyBox = new THREE.Mesh(geometry, myMaterial);
        this.add(skyBox);

        return skyBox;
    }

    createRotatingFilter(texturePath = 'assets/SkyFilter.webp', size = 1100) {
        const geometry = new THREE.SphereGeometry(size);
        const texture = this.textureLoader.load(texturePath);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            transparent: true,
            opacity: .9,
        });
        const rotatingFilter = new THREE.Mesh(geometry, material);
        this.add(rotatingFilter);

        return rotatingFilter;
    }

    update() {
        if(!this.active)return;
        if (this.rotatingFilter1) {
            this.rotatingFilter1.rotation.y += 0.0001;
        }
        if(this.rotatingFilter2) {
            this.rotatingFilter2.rotation.y -= 0.0001;
        }
    }
}