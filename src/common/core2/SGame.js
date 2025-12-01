import { SOL_PHYSICS_SETTINGS } from "../config/SolConstants";
import { NETPROTO } from "../core/NetProtocols";
import { GameState } from "./GameState";

export class SGame {
    constructor(io) {
        this.io = io;

        this.lastTime = 0;
        this.accumulator = 0;
        this.timeStep = SOL_PHYSICS_SETTINGS.timeStep;

        this.tickcounter = 0;

        this.worlds = {
            world1: new GameState()
        }
    }
    async start(loop = true) {
        this.bindEvents();
        if (loop) this.loop();
    }
    bindEvents() {
        for (const p of Object.values(NETPROTO.SERVER)) {
            const f = this[p];
            if (typeof f === "function") {
                this.io.on(p, f.bind(this));
            } else {
                console.warn(`No function ${p}`);
            }
        }
    }
    playerJoined(data) {
        const { id, worldName } = data;
        this.worlds[worldName].addPlayer(id, data);
    }
    loop() {
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.accumulator += dt;
        while (this.accumulator >= this.timeStep) {
            this.step(this.timeStep);
            this.accumulator -= this.timeStep;
        }

        setImmediate(() => this.loop());
    }
    step(dt) {
        this.tickcounter++;
        this.io.emit(NETPROTO.SERVER.WORLD_UPDATE, this.tickcounter);
    }
}