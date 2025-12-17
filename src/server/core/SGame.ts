import { SOL_PHYSICS_SETTINGS } from "@solblade/common/data/SolConstants.js"
import { NET } from "@solblade/common/net/NetProtocol.js"
import { SWorld } from "./SWorld.js"
import type { Server, Socket } from "socket.io";
import type { Actor } from "@solblade/common/actors/Actor.js";

interface User {
    socket?: Socket;
    id?: string;
    worldName?: string;
    actor?: Actor;
}

export class SGame {
    io: Server;
    users: Record<string, User> = {};

    lastTime = 0;
    accumulator = 0;
    timeStep = SOL_PHYSICS_SETTINGS.timeStep
    tickcounter = 0;

    worlds: Record<string, SWorld>;
    constructor(io: Server) {
        this.io = io;

        this.worlds = {
            world1: new SWorld("world1"),
            world2: new SWorld("world2")
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
        const connection = (socket: Socket) => {
            this.users[socket.id] = { socket };
            socket.on("disconnect", () => this.leave(socket));
            for (const p of Object.values(NET.CLIENT)) {
                const f = this[p];
                if (typeof f === "function") {
                    const boundF = f.bind(this);
                    socket.on(p, (data) => boundF(data, socket));
                } else {
                    console.warn(`No function ${p}`);
                }
            }
        }
        if (localSocket) connection(localSocket);
        this.io.on("connection", connection);
    }
    join(data, socket) {
        const user = this.users[socket.id];
        const { worldName } = data;
        user.worldName = worldName;
        user.actor = this.worlds[worldName].addPlayer(socket.id, data);

        this.io.emit(NET.SERVER.WELCOME, "welcome!");
    }
    leave(socket) {
        const id = socket.id;
        const user = this.users[id];
        const world = this.worlds[user.worldName];

        if (!world) return;
        world.removePlayer?.(id);
        this.io.emit(NET.SERVER.REMOVE_ACTOR, id);
    }
    input(data, socket) {
        const user = this.users[socket.id];
    }
    playerUpdate(data, socket) {
        const user = this.users[socket.id];
        if (user.actor) {
            user.actor.replication?.serverUpdate(data);
        }
    }
    playerInput(data, socket){
        //console.log(data);
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