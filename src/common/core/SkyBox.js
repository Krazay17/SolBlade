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
        this.rotatingFilter2 = await this.createRotatingFilter('assets/SkyFilter2.webp', 1950);
        this.rotatingFilter2.rotation.set(45, 45,45);
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
        skyBox.renderOrder = 0;
        this.add(skyBox);

        return skyBox;
    }

    async createRotatingFilter(texturePath = 'assets/SkyFilter.webp', size = 1100) {
        const geometry = new THREE.SphereGeometry(size);
        const texture = await this.loader.loadAsync(texturePath)
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.BackSide,
            depthWrite: false,
            transparent: true,
            opacity: .8,
        });
        const rotatingFilter = new THREE.Mesh(geometry, material);
        rotatingFilter.renderOrder = 1;
        this.add(rotatingFilter);

        return rotatingFilter;
    }

    tick(dt) {
        if (!this.active) return;
        if (this.rotatingFilter1) {
            this.rotatingFilter1.rotation.y += dt * 0.01;
        }
        if (this.rotatingFilter2) {
            this.rotatingFilter2.rotation.y -= dt * 0.01;
        }
    }
}