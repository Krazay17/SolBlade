import { Player } from "@solblade/client/actors/player/Player.js";
import { UserInput } from "@solblade/client/core/UserInput.js";
import { NET } from "@solblade/common/net/NetProtocol.js";
import { PerspectiveCamera, Scene } from "three";
import { CWorld1 } from "../world/CWorld1.js";
import { CWorld2 } from "../world/CWorld2.js";
import { SolLoading } from "./SolLoading.js";
import solSave from "./SolSave.js";
import { CNet } from "./CNet.js";
import { CWorld } from "../world/CWorld.js";

export class CGame {
    scene: Scene;
    camera: PerspectiveCamera;
    input: UserInput;
    loader: SolLoading;
    net: CNet;

    worldRegistry;
    player: Player;

    world: CWorld;
    stateIndex = 0;
    netBound = false;
    constructor(scene: Scene, camera: PerspectiveCamera, input: UserInput, loader: SolLoading, net: CNet) {
        this.scene = scene;
        this.camera = camera;
        this.input = input;
        this.loader = loader;
        this.net = net;

        this.worldRegistry = {
            world1: CWorld1,
            world2: CWorld2,
        }

        this.player = new Player(this, {
            worldName: solSave.worldName,
            model: "spikeMan",
            pos: [0, 10, 0],
        }, this.net);

        window.addEventListener('keydown', (e) => {
            if (e.code !== "KeyE") return;
            console.time("test");
            this.net.emit(NET.CLIENT.TEST, "test");
        });
    }
    clientTest() {
        console.timeEnd("test");
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
        this.net.on?.("disconnect", () => this.netDisconnnect());
        for (const p of Object.values(NET.SERVER)) {
            const h = this[p];
            if (typeof h === "function") {
                this.net.on?.(p, h.bind(this));
            } else console.warn(`No function ${p}`);
        }
    }
    netConnect() {
        this.player.setId(this.net.socket.id);
        this.netBinds();
        this.net.emit(NET.CLIENT.JOIN, this.player.serialize());
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
    step(dt) {
        if (this.input) {
            const payload = this.input.inputHandler.getTickPayload();
            if (!payload) return;

            // Convert the object to raw bytes
            const binaryPayload = this.input.inputHandler.serializeInput(payload);

            // Send the raw bytes
            this.net.emit(NET.CLIENT.PLAYER_INPUT, binaryPayload);
        }
        if (this.world) this.world.step(dt);
    }
    snap(data) {
        this.world?.updateState(data);
    }
    welcome(data) {
        console.log(data);
    }
    removeActor(id) {
        this.world?.removeActor(id);
    }
}