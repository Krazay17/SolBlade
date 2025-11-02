import { EffectComposer, FilmPass, FXAAShader, GammaCorrectionShader, OutlinePass, RenderPass, ShaderPass, SobelOperatorShader, SSAOPass, UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { MultiplyBlending, Vector2 } from "three";

export default class SolRenderPass {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.composer = this.createComposer();
        this.renderPass = this.createRenderPass();
        this.ssaoPass = this.createSSAOPass();
        this.bloomPass = this.createBloomPass();

        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.addPasses();
    }
    createComposer() {
        const composer = new EffectComposer(this.renderer);
        return composer;
    }
    createRenderPass() {
        return new RenderPass(this.scene, this.camera);
    }
    createSSAOPass() {
        const pass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight, 8);
        pass.minDistance = 0.005;
        pass.maxDistance = 0.1;
        return pass;
    }
    createBloomPass() {
        const pass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), .2, .5, 1);
        return pass;
    }
    addPasses() {
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.ssaoPass);
        this.composer.addPass(this.bloomPass);
    }
    onWindowResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderPass.setSize(w, h);
        this.composer.setSize(w, h);
    }
}


