import * as THREE from 'three';
import CGame from '../../../client/core/CGame';
import CSolWorld from './CSolWorld';

export default class SkyBox extends THREE.Object3D {
    /**
     * 
     * @param {CGame} game 
     * @param {CSolWorld} world 
     */
    constructor(game, world) {
        super();
        this.game = game;
        this.world = world;

        this.loader = game.textureLoader;

        this.active = false;

        this.world.add(this);
        this.init();
    }
    async init() {
        this.sky = await this.createSky();
        this.rotatingFilter1 = await this.createRotatingFilter('assets/SkyFilter.webp', 1950);
        this.rotatingFilter2 = await this.createRotatingFilter('assets/SkyFilter2.webp', 1900);
        this.active = true;
    }
    destroy() {
        this.active = false;
        this.world.remove(this);
        this.loader = null;
        this.sky = null;
        this.rotatingFilter1 = null;
        this.rotatingFilter2 = null;
        this.world = null;
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

    update(dt) {
        if (!this.active) return;
        if (this.rotatingFilter1) {
            this.rotatingFilter1.rotation.y += 0.0001;
        }
        if (this.rotatingFilter2) {
            this.rotatingFilter2.rotation.y -= 0.0001;
        }
    }
}