import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import { SOL_PHYSICS_SETTINGS } from "../../common/config/SolConstants.js";
import CPlayer from "../actors/CPlayer.js";
import SoundPlayer from "../audio/SoundPlayer.js";
import Input from "../input/UserInput.js";
import MeshManager from "../managers/MeshManager.js";
import { SolGraphics } from "../rendering/SolGraphics.js";
import LoadingBar from "../ui/LoadingBar.js";
import { menuButton } from "../ui/MainMenu.js";
import { worldRegistry } from "./CRegistry.js";
import LocalData from "./LocalData.js";
import CSolWorld from "../worlds/CSolWorld.js";
import { NetworkManager } from "./NetworkManager.js";
import ClientEvents from "./ClientEvents.js";

export default class GameClient {
    /**
     * 
     * @param {HTMLElement} canvas 
     * @param {Input} input 
     * @param {NetworkManager} net;
     */
    constructor(canvas, input, net) {
        this.canvas = canvas;
        this.input = input;
        this.net = net;

        this.ready = false;
        this.lastTime = 0;
        this.accumulator = 0;
        /**@type {CSolWorld} */
        this.world = null;

        this.loadingBar = new LoadingBar();
        this.loadingManager = new THREE.LoadingManager(this.loadingBar.finish, this.loadingBar.update);
        this.loader = new THREE.Loader(this.loadingManager);
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        this.glbLoader = new GLTFLoader(this.loadingManager);
        this.meshManager = new MeshManager(this);

        this.graphics = new SolGraphics(this.canvas);
        this.camera = this.graphics.camera;
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);
        this.soundPlayer = new SoundPlayer(this, this.audioListener);

        this.player = new CPlayer(this, { pos: [0, 18, 0] });
        this.player.makeMesh(this.meshManager);
        this.graphics.add(this.player.graphics);

        this.netEvents = new ClientEvents(this, this.net);
        this.bindings();
    }
    get physics() { return this.world.physics };
    addActor(actor) {
        this.world.actorManager.addActor(actor);
    }
    newActor(actor) {
        this.world.actorManager.newActor(actor);
    }
    bindings() {
        window.addEventListener('focus', () => {
            this.isFocused = true;
            this.running = true;
        });
        window.addEventListener('blur', () => {
            this.isFocused = false;
        });
        menuButton('world1', () => {
            this.newWorld('world1');
        })
        menuButton('world2', () => {
            this.newWorld('world2');
        })
    }
    async start() {
        await this.newWorld("world1");
        this.running = true;
        requestAnimationFrame(this.loop.bind(this));
    }
    async newWorld(name) {
        const worldClass = worldRegistry[name];
        if (!worldClass) return;
        if (this.world) this.world.exit();
        this.world = new worldClass(this);
        await this.world.enter();
        this.player.setWorld(this.world);
        this.addActor(this.player);
        this.ready = true;
    }
    loop(time) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;
        if (dt > 1) this.handleSleep();
        if (this.running && this.ready) {
            this.accumulator += dt;
            this.accumulator = Math.min(this.accumulator, 0.25);
            const timestep = SOL_PHYSICS_SETTINGS.timeStep;
            while (this.accumulator >= timestep) {
                this.step(timestep);
                this.accumulator -= timestep;
            }
            this.tick(dt);
            this.graphics.render(dt);
        }
        requestAnimationFrame(this.loop.bind(this));
    }
    tick(dt) {
        if (this.world) this.world.tick(dt);
    }
    step(dt) {
        if (this.world) this.world.step(dt);
    }
    handleSleep() {
        if (this.isFocused) return;
        this.running = false;
    }
    // savePlayerState() {
    //     LocalData.position = this.player.pos;
    //     LocalData.rotation = this.player.rot;
    //     LocalData.weapons.left = this.player.data.leftWeapon;
    //     LocalData.weapons.right = this.player.data.rightWeapon;
    //     LocalData.worldName = this.world.name;
    // }
}

