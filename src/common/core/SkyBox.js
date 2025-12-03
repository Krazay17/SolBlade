import * as THREE from 'three';

export default class SkyBox extends THREE.Object3D {
    /**
     * @param {THREE.TextureLoader} textureLoader
     */
    constructor(textureLoader) {
        super();
        this.loader = textureLoader;

        this.active = false;
        this.init();
    }
    async init() {
        this.sky = await this.createSky();
        this.rotatingFilter1 = await this.createRotatingFilter('assets/SkyFilter.webp', 1900);
        this.rotatingFilter2 = await this.createRotatingFilter('assets/SkyFilter2.webp', 1800);
        this.active = true;
    }
    destroy() {
        this.active = false;
        this.loader = null;
        this.sky = null;
        this.rotatingFilter1 = null;
        this.rotatingFilter2 = null;
    }

    async createSky() {
        const geometry = new THREE.SphereGeometry(2000);
        const myTexture = await this.loader.loadAsync('assets/RedSky0.webp');
        const myMaterial = new THREE.MeshBasicMaterial({
            map: myTexture,
            side: THREE.BackSide,
        });
        const skyBox = new THREE.Mesh(geometry, myMaterial);
        this.add(skyBox);

        return skyBox;
    }

    async createRotatingFilter(texturePath = 'assets/SkyFilter.webp', size = 1100) {
        const geometry = new THREE.SphereGeometry(size);
        const texture = await this.loader.loadAsync(texturePath)
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

    tick(dt) {
        if (!this.active) return;
        // if (this.rotatingFilter1) {
        //     this.rotatingFilter1.rotation.y += dt*.01;
        // }
        // if (this.rotatingFilter2) {
        //     this.rotatingFilter2.rotation.y -= dt;
        // }
    }
}