import CPlayer from "@solblade/client/actors/CPlayer.js";
import { worldRegistry } from "./ClientRegistry.js";
import { CWorld } from "./CWorld.js";
import { SolLoading } from "./SolLoading.js";
import solSave from "./SolSave.js";
import { NET } from "./NetProtocol.js";
import UserInput from "@solblade/client/input/UserInput.js";
import { Actions } from "@solblade/client/input/Actions.js";

export class CGame {
    /**@type {CWorld} */
    world;
    stateIndex = 0;
    socket;
    /**
     * 
     * @param {*} scene 
     * @param {*} camera 
     * @param {UserInput} input 
     * @param {SolLoading} loader 
     */
    constructor(scene, camera, input, loader) {
        this.scene = scene;
        this.camera = camera;
        this.input = input;
        this.loader = loader;

        this.player = new CPlayer(this);
        this.player.init();
        this.player.pos = [0, 55, 0];

        window.addEventListener('keydown', (e) => {
            if(e.code !== "KeyE")return;
            console.time("test");
            this.socket.emit(NET.CLIENT.TEST);
        })

        this.start();
    }
    async start() {
        await this.newWorld(solSave.worldName);
    }
    getActorById(id) {
        this.world.actors.get(id);
    }
    netBinds(socket) {
        this.socket = socket;
        for (const p of Object.values(NET.SERVER)) {
            const h = this[p];
            if (typeof h === "function") {
                this.socket.on(p, h.bind(this));
            } else console.warn(`No function ${p}`);
        }
        this.socket.emit(NET.CLIENT.JOIN, this.player.serialize());
    }
    async newWorld(name) {
        const world = worldRegistry[name];
        if (!world) return
        if (this.world) this.world.exit();
        this.world = new world(this.scene, this.loader);
        await this.world.start();
        this.player.setWorld(this.world);
        this.world.localPlayer = this.player;
    }
    tick(dt) {
        if(this.world)this.world.tick(dt);
        this.player.tick(dt);
    }
    clientTest() {
        console.timeEnd("test");
    }
    step(dt) {
        this.world.step(dt);
    }
    snap(data) {
        this.world.updateState(data);
    }
    welcome(data) {
        console.log(data);
    }
}