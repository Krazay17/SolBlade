import { EffectComposer, RenderPass, UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { Vector2 } from "three";

export default class SolRenderPass {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.bloomEnabled = true;

        this.composer = this.createComposer();
        this.renderPass = this.createRenderPass();
        this.bloomPass = this.createBloomPass();

        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // const bloomButton = menuButton('Bloom', () => {
        //     this.bloomEnabled = !this.bloomEnabled;
        //     if (!this.bloomEnabled) {
        //         const pass = this.composer.passes.find(a => a instanceof UnrealBloomPass);
        //         if (pass) {
        //             this.composer.removePass(this.bloomPass);
        //             bloomButton.classList.remove('active');
        //         }
        //     } else {
        //         const pass = this.composer.passes.find(a => a instanceof UnrealBloomPass);
        //         if (!pass) {
        //             this.composer.addPass(this.bloomPass);
        //             bloomButton.classList.add('active');
        //         }
        //     }
        // });
        // bloomButton.classList.add('active');

        this.addPasses();
    }
    createComposer() {
        const composer = new EffectComposer(this.renderer);
        return composer;
    }
    createRenderPass() {
        return new RenderPass(this.scene, this.camera);
    }
    createBloomPass() {
        const pass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), .2, .5, 1);
        return pass;
    }
    addPasses() {
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.bloomPass);
    }
    onWindowResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderPass.setSize(w, h);
        this.composer.setSize(w, h);
    }
}


