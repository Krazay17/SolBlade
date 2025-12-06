import { SOL_PHYSICS_SETTINGS } from "@solblade/common/data/SolConstants.js"
import { NET } from "@solblade/common/net/NetProtocol.js"
import { SWorld } from "../world/SWorld.js"
import { LocalServerTransport } from "@solblade/common/net/LocalServerTransport.js";

/**
 * @typedef {import("socket.io").Server} ServerIO
 * @typedef {import("@solblade/client/core/CNet.js").LocalServerIO} LocalServerIO
 */

export class SGame {
    /**
     * @param {ServerIO | LocalServerIO | LocalServerTransport} io 
     */
    constructor(io) {
        this.io = io;
        this.sockets = {};

        this.lastTime = 0;
        this.accumulator = 0;
        this.timeStep = SOL_PHYSICS_SETTINGS.timeStep;
        this.tickcounter = 0;

        this.worlds = {
            world1: new SWorld("world1"),
            //world2: new SWorld("world2")
        }
    }
    async start(loop = true, localSocket) {
        this.bindEvents(localSocket);
        for (const world of Object.values(this.worlds)) {
            await world.start();
        }
        if (loop) this.loop();
    }
    bindEvents(localSocket) {
        const connection = (socket) => {
            const newSocket = this.sockets[socket.id] = socket;
            for (const p of Object.values(NET.CLIENT)) {
                const f = this[p];
                if (typeof f === "function") {
                    if (newSocket) newSocket.on(p, f.bind(this));
                } else {
                    console.warn(`No function ${p}`);
                }
            }
        }
        if (localSocket) connection(localSocket);
        this.io.on("connection", connection);
    }
    join(data) {
        console.log('sjoin')
        // const { id, worldName } = data;
        // this.worlds[worldName].addPlayer(id, data);
        this.io.emit(NET.SERVER.WELCOME, "welcome!");
    }
    serverTest(cb) {
        //if (cb) cb(NET.SERVER.TEST);
        this.io.emit(NET.SERVER.TEST);
    }
    loop() {
        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;
        this.accumulator = Math.min(this.accumulator + dt, 0.25);
        while (this.accumulator >= this.timeStep) {
            this.step(this.timeStep);
            this.tick(this.timeStep);
            this.accumulator -= this.timeStep;
        }
        setImmediate(() => this.loop());
    }
    tick(dt) {
        for (const world of Object.values(this.worlds)) {
            world.tick(dt);
        }
    }
    step(dt) {
        for (const world of Object.values(this.worlds)) {
            const update = world.step(dt);
            if (update) {
                const { players, state } = update;
                players.forEach(p => {
                    this.io.to(p).emit(NET.SERVER.SNAP, state);
                })
            }
        }
    }
}