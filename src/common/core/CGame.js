import CPlayer from "@solblade/client/actors/CPlayer.js";
import { worldRegistry } from "./ClientRegistry.js";
import { CWorld } from "./CWorld.js";
import { SolLoading } from "./SolLoading.js";
import solSave from "./SolSave.js";
import { NETPROTO } from "./NetProtocol.js";

export class CGame {
    /**@type {CWorld} */
    world;
    stateIndex = 0;
    socket;
    /**
     * 
     * @param {*} scene 
     * @param {*} camera 
     * @param {*} input 
     * @param {SolLoading} loader 
     */
    constructor(scene, camera, input, loader) {
        this.scene = scene;
        this.camera = camera;
        this.input = input;
        this.loader = loader;

        this.player = new CPlayer(this);
        this.player.pos = [0, 55, 0];

        this.start();
    }
    async start() {
        await this.newWorld(solSave.worldName);
    }
    getActorById(id) {
        this.world.gameState.actors.get(id);
    }
    netBinds(socket) {
        this.socket = socket;
        for (const p of Object.values(NETPROTO.SERVER)) {
            const h = this[p];
            if (typeof h === "function") {
                this.socket.on(p, h.bind(this));
            } else console.warn(`No function ${p}`);
        }
        this.socket.emit(NETPROTO.CLIENT.JOIN_GAME, this.player.serialize());
    }
    async newWorld(name) {
        const world = worldRegistry[name];
        if (!world) return
        if (this.world) this.world.exit();
        this.world = new world(this.scene, this.loader);
        await this.world.start();
        this.player.init(this.world);
    }
    spawnActor(data){
        console.log(data)
    }
    tick(dt) {
        this.world.tick(dt);
        this.player.tick(dt);
    }
    step(dt) {
        this.world.step(dt);
    }
    getUserCommand() {
        return null;
    }
    worldSnap(data) {
        this.world.gameState.updateState(data);
    }
}