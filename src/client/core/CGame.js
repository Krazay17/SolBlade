import { Player } from "@solblade/client/actors/player/Player.js";
import { UserInput } from "@solblade/client/core/UserInput.js";
import { NET } from "@solblade/common/net/NetProtocol.js";
import { CWorld } from "../world/CWorld.js";
import { CWorld1 } from "../world/index.js";
import { SolLoading } from "./SolLoading.js";
import solSave from "./SolSave.js";
import { Scene } from "three";
import { CameraComponent } from "@solblade/common/actors/components/CameraComponent.js";
import { AttachBox } from "@solblade/common/actors/components/AttachBox.js";

export class CGame {
    /**@type {CWorld} */
    world;
    stateIndex = 0;
    socket;
    netBound = false;
    /**
     * 
     * @param {Scene} scene 
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

        this.player = new Player(this, {
            meshName: "spikeMan",
            pos: [0, 10, 0],
        });
        this.player.add(new AttachBox(this.player));

        window.addEventListener('keydown', (e) => {
            if (e.code !== "KeyE") return;
            console.time("test");
            this.socket.emit(NET.CLIENT.TEST);
        });
    }
    async start() {
        await this.newWorld(solSave.worldName);
    }
    getActorById(id) {
        this.world.actors.get(id);
    }
    netBinds() {
        if (this.netBound) return;
        this.netBound = true;
        this.socket.on?.("disconnect", () => this.netDisconnnect());
        for (const p of Object.values(NET.SERVER)) {
            const h = this[p];
            if (typeof h === "function") {
                this.socket.on?.(p, h.bind(this));
            } else console.warn(`No function ${p}`);
        }
    }
    netConnect(socket) {
        this.socket = socket;
        this.player.setId(socket.id);
        this.netBinds();
        this.socket.emit(NET.CLIENT.JOIN, this.player.serialize());
    }
    netDisconnnect() {
        this.world.removeRemoteActors();
    }
    async newWorld(name) {
        const world = this.worldRegistry[name];
        if (!world) return
        if (this.world) this.world.exit();
        this.world = new world(this);
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
        this.world?.updateState(data);
    }
    welcome(data) {
        console.log(data);
    }
}