import RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons";
import Input from "./Input";
import Net from "./Net";
import SolPhysics from "../core/SolPhysics";
import SolRenderPass from "./SolRenderPass";
import SoundPlayer from "./SoundPlayer";
import LocalData from "./LocalData"
import CSolWorld from "./CSolWorld";
import LoadingBar from "./LoadingBar";

await RAPIER.init();


export default class CGame {
    /**
     * 
     * @param {Document} canvas 
     * @param {Input} input 
     * @param {Net} net 
     */
    constructor(canvas, input, net) {
        this.canvas = canvas;
        this.input = input;
        this.net = net;

        this.timeStep = 1 / 120;
        this.subStep = 6;
        this.running = false;
        this.lastTime = 0;
        this.accumulator = 0;

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.graphicsWorld = new THREE.Scene();

        this.physics = new SolPhysics(this);

        this.loadingBar = new LoadingBar();
        this.loadingManager = new THREE.LoadingManager(this.loadingBar.finish, this.loadingBar.update);
        this.loader = new THREE.Loader(this.loadingManager);
        this.glbLoader = new GLTFLoader(this.loadingManager);

        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, .8, 3000);
        this.camera.position.set(0, 25, 0);
        this.camera.lookAt(0, 0, 1);
        this.graphicsWorld.add(this.camera);

        this.solRender = new SolRenderPass(this.renderer, this.graphicsWorld, this.camera);
        this.worldLight();

        this.audioListener = new THREE.AudioListener();
        this.soundPlayer = new SoundPlayer(this, this.audioListener);
        this.camera.add(this.audioListener);

        this.player = null;
        this.solWorld = new CSolWorld(this, "scene2"); //LocalData.sceneName || 

        this.bindings();
    }
    bindings() {
        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            this.renderer.setSize(w, h);
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
        })
        window.addEventListener('focus', () => {
            this.isFocused = true;
            this.running = true;
        });
        window.addEventListener('blur', () => {
            this.isFocused = false;
        });
    }
    start() {
        this.init();
        this.running = true;
        requestAnimationFrame(this.tick.bind(this));
    }
    async init() {
        this.ready = true;
    }
    tick(time) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        if (dt > 1) {
            this.handleSleep();
        }

        if (this.running) {
            this.accumulator += dt;
            this.accumulator = Math.min(this.accumulator, 0.25);
            // fixed step
            while (this.running && (this.accumulator >= this.timeStep)) {
                this.scene?.step(this.timeStep);
                this.physics?.step(this.timeStep);

                this.accumulator -= this.timeStep;
            }
            // quick step
            this.scene?.tick(dt);
            this.graphics?.tick(dt);

            this.solRender.composer.render(dt);
        }

        requestAnimationFrame(this.tick.bind(this));
    }
    handleSleep() {
        if (this.isFocused) return;
        this.running = false;
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
        this.graphicsWorld.add(dirLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, .05);
        this.graphicsWorld.add(ambientLight);
    }
    savePlayerState() {
        LocalData.position = this.player.pos;
        LocalData.rotation = this.player.rot;
        LocalData.weapons.left = this.player.data.leftWeapon;
        LocalData.weapons.right = this.player.data.rightWeapon;
        LocalData.sceneName = this.sceneName;
    }
}