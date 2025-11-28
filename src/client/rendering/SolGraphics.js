import * as THREE from "three";
import { EffectComposer, RenderPass, UnrealBloomPass } from "three/examples/jsm/Addons.js";

export class SolGraphics {
    constructor(canvas, camera) {
        this.canvas = canvas
        this.camera = camera;

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.bloomEnabled = true;

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, .8, 3000);
        this.camera.lookAt(0, 0, 1);
        this.scene.add(this.camera);

        this.composer = this.createComposer();
        this.renderPass = this.createRenderPass();
        this.bloomPass = this.createBloomPass();

        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.addPasses();
        this.worldLight();
    }
    add(obj){
        this.scene.add(obj);
    }
    remove(obj){
        this.scene.remove(obj);
    }
    render(dt) {
        this.composer.render(dt);
    }
    createComposer() {
        const composer = new EffectComposer(this.renderer);
        return composer;
    }
    createRenderPass() {
        return new RenderPass(this.scene, this.camera);
    }
    createBloomPass() {
        const pass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), .2, .5, 1);
        return pass;
    }
    addPasses() {
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.bloomPass);
    }
    onWindowResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.setSize(w, h);
        this.renderPass.setSize(w, h);
        this.composer.setSize(w, h);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }
    worldLight() {
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const dirLight = new THREE.DirectionalLight(0xffeeee, .4);

        dirLight.position.set(0, 100, 0);
        const target = new THREE.Vector3().addVectors(dirLight.position, new THREE.Vector3(1, -1, 1).normalize())
        dirLight.lookAt(target);

        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 200;

        // menuSlider('Shadow Quality', 1, 10, 1, (value) => {
        //     dirLight.shadow.mapSize.width = 1024 * value;
        //     dirLight.shadow.mapSize.height = 1024 * value;
        //     if (dirLight.shadow.map) {
        //         dirLight.shadow.map.dispose();
        //         dirLight.shadow.map = null;
        //     }
        //     dirLight.shadow.needsUpdate = true;
        // })
        dirLight.shadow.mapSize.width = 1024 * 4;
        dirLight.shadow.mapSize.height = 1024 * 4;
        dirLight.shadow.bias = -0.0001;
        dirLight.shadow.normalBias = 0.02;

        dirLight.castShadow = true;
        this.scene.add(dirLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, .05);
        this.scene.add(ambientLight);
    }
}


