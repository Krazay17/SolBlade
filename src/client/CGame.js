import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons";
import Input from "./Input";
import Net from "./Net";
import SolRenderPass from "./SolRenderPass";
import SoundPlayer from "./SoundPlayer";
import LocalData from "./LocalData"
import LoadingBar from "./LoadingBar";
import GameCore from "../core/GameCore";
import CSolWorld from "./worlds/CSolWorld";
import CSolWorld2 from "./worlds/CSolWorld2";
import { menuButton } from "./ui/MainMenu";
import CPlayer from "./actors/CPlayer";

const sceneRegistry = {
    scene: CSolWorld,
    scene2: CSolWorld2,
}

export default class CGame extends GameCore {
    /**
     * 
     * @param {Document} canvas 
     * @param {Input} input 
     * @param {Net} net 
     */
    constructor(canvas, input, net) {
        super();
        this.canvas = canvas;
        this.input = input;
        this.net = net;

        this.timeStep = 1 / 120;
        this.subStep = 6;
        this.lastTime = 0;
        this.accumulator = 0;
        /**@type {CSolWorld} */
        this.solWorld = null;
        this.worldName = "scene2";

        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.loadingBar = new LoadingBar();
        this.loadingManager = new THREE.LoadingManager(this.loadingBar.finish, this.loadingBar.update);
        this.loader = new THREE.Loader(this.loadingManager);
        this.glbLoader = new GLTFLoader(this.loadingManager);

        this.graphics = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, .8, 3000);
        this.camera.position.set(0, 25, 0);
        this.camera.lookAt(0, 0, 1);
        this.graphics.add(this.camera);

        this.audioListener = new THREE.AudioListener();
        this.soundPlayer = new SoundPlayer(this, this.audioListener);
        this.camera.add(this.audioListener);

        this.solRender = new SolRenderPass(this.renderer, this.graphics, this.camera);
        this.worldLight();

        //this.player = new CPlayer(this, { pos: LocalData.position || [0, 15, 0] });
        this.player = new CPlayer(this, { pos: [0, 15, 0] });
        this.makeWorld(LocalData.worldName || "scene2");

        this.bindings();

        menuButton('level2', () => {
            this.makeWorld('scene2');
        })
        menuButton('level3', () => {
            this.makeWorld('scene');
        })
    }
    bindings() {
        window.addEventListener('resize', () => {
            const w = window.innerWidth;
            const h = window.innerHeight;
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
        this.makeWorld();
        this.running = true;
        requestAnimationFrame(this.tick.bind(this));
    }
    makeWorld(worldName) {
        const sceneClass = sceneRegistry[worldName];
        if (!sceneClass) return;
        if (this.solWorld) this.solWorld.exit();
        this.ready = false;
        this.solWorld = new sceneClass(this);
        this.player.makeBody(this.solWorld.physics);
        this.solWorld.enter(() => {
            this.ready = true
            this.worldName = worldName;
        });
    }
    tick(time) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;
        if (dt > 1) {
            this.handleSleep();
        }
        if (this.running && this.ready) {
            this.player?.tick(dt);
            this.solWorld?.tick(dt);
            this.solRender.composer.render(dt);
        }
        requestAnimationFrame(this.tick.bind(this));
    }
    fixedStep(dt) {
        this.solWorld?.fixedStep(dt);
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
        this.graphics.add(dirLight);

        const ambientLight = new THREE.AmbientLight(0xffffff, .05);
        this.graphics.add(ambientLight);
    }
    savePlayerState() {
        LocalData.position = this.player.pos;
        LocalData.rotation = this.player.rot;
        LocalData.weapons.left = this.player.data.leftWeapon;
        LocalData.weapons.right = this.player.data.rightWeapon;
        LocalData.worldName = this.worldName;
    }
}

