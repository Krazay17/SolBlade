import { EffectComposer, FilmPass, FXAAShader, GammaCorrectionShader, OutlinePass, RenderPass, ShaderPass, SobelOperatorShader, SSAOPass, UnrealBloomPass } from "three/examples/jsm/Addons.js";
import { Vector2 } from "three";

export default class SolRenderPass {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.composer = this.createComposer();
        this.renderPass = this.createRenderPass();
        this.bloomPass = this.createBloomPass();
        this.ssaoPass = this.createSSAOPass();
        this.fxaaPass = this.createFXAAPass();

        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.addPasses();
    }
    createComposer() {
        const composer = new EffectComposer(this.renderer);
        composer.renderToScreen = true;
        composer.setSize(window.innerWidth, window.innerHeight);
        composer.setPixelRatio(window.devicePixelRatio);

        composer.renderer.outputColorSpace = this.renderer.outputColorSpace;
        composer.renderer.toneMapping = this.renderer.toneMapping;
        composer.renderer.toneMappingExposure = this.renderer.toneMappingExposure;
        return composer;
    }
    createRenderPass() {
        return new RenderPass(this.scene, this.camera);
    }
    createBloomPass() {
        const pass = new UnrealBloomPass(new Vector2(window.innerWidth, window.innerHeight), .2, .8, 0);
        return pass;
    }
    createSSAOPass() {
        const pass = new SSAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight, 8);
        pass.minDistance = 0.005;
        pass.maxDistance = 0.1;
        return pass;
    }
    createFXAAPass() {
        const pass = new ShaderPass(FXAAShader);
        pass.material.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
        return pass;
    }

    addPasses() {
        this.composer.addPass(this.renderPass);
        this.composer.addPass(this.ssaoPass);
        this.composer.addPass(this.bloomPass);
        this.composer.addPass(this.fxaaPass);
    }
    onWindowResize() {
        this.ssaoPass.width = window.innerWidth;
        this.ssaoPass.height = window.innerHeight;
        this.bloomPass.resolution = new Vector2(window.innerWidth, window.innerHeight);
        this.fxaaPass.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
    }
}


