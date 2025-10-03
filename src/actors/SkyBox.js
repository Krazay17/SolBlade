import * as THREE from 'three';
import Globals from '../utils/Globals';

export default class SkyBox extends THREE.Object3D {
    constructor() {
        super();
        this.textureLoader = Globals.game.loadingManager.textureLoader;
        this.createSkyBox();
        this.rotatingFilter1 = this.createRotatingFilter();
        this.rotatingFilter2 = this.createRotatingFilter('assets/SkyFilter2.webp', 1000);
    }

    createSkyBox() {
        const geometry = new THREE.SphereGeometry(2500);
        const myTexture = this.textureLoader.load('assets/RedSky0.webp');
        const myMaterial = new THREE.MeshBasicMaterial({
            map: myTexture,
            side: THREE.BackSide
        });
        const skyBox = new THREE.Mesh(geometry, myMaterial);
        this.add(skyBox);
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
        if (this.rotatingFilter1) {
            this.rotatingFilter1.rotation.y += 0.0001;
        }
        if(this.rotatingFilter2) {
            this.rotatingFilter2.rotation.y -= 0.0001;
        }
    }
}