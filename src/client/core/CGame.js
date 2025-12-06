import CPlayer from "@solblade/client/actors/player/CPlayer.js";
import { UserInput } from "@solblade/client/core/UserInput.js";
import { NET } from "@solblade/common/net/NetProtocol.js";
import { CWorld } from "../world/CWorld.js";
import { CWorld1 } from "../world/index.js";
import { SolLoading } from "./SolLoading.js";
import solSave from "./SolSave.js";

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

        this.worldRegistry = {
            world1: CWorld1,
        }

        this.player = new CPlayer(this);

        window.addEventListener('keydown', (e) => {
            if (e.code !== "KeyE") return;
            console.time("test");
            this.socket.emit(NET.CLIENT.TEST);
        })
    }
    async start() {
        await this.newWorld(solSave.worldName);
        await this.player.init();
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
        this.socket.emit(NET.CLIENT.JOIN, { id: '1', pos: [0, 1, 0] });
    }
    async newWorld(name) {
        const world = this.worldRegistry[name];
        if (!world) return
        if (this.world) this.world.exit();
        this.world = new world(this.scene, this.loader);
        await this.world.start();
        this.player.setWorld(this.world);
    }
    tick(dt) {
        if (this.world) this.world.tick(dt);
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