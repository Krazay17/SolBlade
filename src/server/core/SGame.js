import { SOL_PHYSICS_SETTINGS } from "@solblade/common/config/SolConstants.js"
import { NETPROTO } from "@solblade/common/core/NetProtocol.js"
import { SWorld } from "./SWorld.js"

/**
 * @typedef {import("socket.io").Server} ServerIO
 * @typedef {import("@solblade/common/core/CNet.js").LocalServerIO} LocalServerIO
 */

export class SGame {
    /**
     * @param {ServerIO | LocalServerIO} io 
     */
    constructor(io) {
        this.io = io;

        this.lastTime = 0;
        this.accumulator = 0;
        this.timeStep = SOL_PHYSICS_SETTINGS.timeStep;
        this.tickcounter = 0;

        this.worlds = {
            world1: new SWorld("world1"),
            world2: new SWorld("world2")
        }
    }
    async start(loop = true) {
        this.bindEvents();
        for (const world of Object.values(this.worlds)) {
            world.start();
        }
        if (loop) this.loop();
    }
    bindEvents() {
        for (const p of Object.values(NETPROTO.CLIENT)) {
            const f = this[p];
            if (typeof f === "function") {
                this.io.on(p, f.bind(this));
            } else {
                console.warn(`No function ${p}`);
            }
        }
    }
    joinGame(data) {
        const { id, worldName } = data;
        this.worlds[worldName].addPlayer(id, data);
    }
    loop() {
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.accumulator = Math.min(this.accumulator + dt, 0.25);
        while (this.accumulator >= this.timeStep) {
            this.step(this.timeStep);
            this.accumulator -= this.timeStep;
        }
        setImmediate(() => this.loop());
    }
    step(dt) {
        for (const world of Object.values(this.worlds)) {
            const update = world.step(dt);
            if (update) {
                const { players, state } = update;
                players.forEach(p => {
                    this.io.to(p).emit(NETPROTO.SERVER.WORLD_SNAP, state);
                })
            }
        }
    }
}