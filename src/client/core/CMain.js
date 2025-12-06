import RAPIER from "@dimforge/rapier3d-compat";
import { UserInput } from "@solblade/client/core/UserInput.js";
import { io, WebSocket } from "socket.io-client";
import { SOL_PHYSICS_SETTINGS } from "@solblade/common/data/SolConstants.js";
import { LocalServerTransport } from "@solblade/common/net/LocalServerTransport.js";
import { LocalTransport } from "@solblade/common/net/LocalTransport.js";
import { CGame } from "./CGame.js";
import { SolLoading } from "./SolLoading.js";
import { SolRender } from "./SolRender.js";
/**
 * @typedef {import("@solblade/server/core/SGame.js").SGame}localServer
 */
await RAPIER.init();

class App {
    renderer;
    input;
    game;
    /**@type {WebSocket | LocalTransport} */
    socket;
    /**@type {localServer} */
    localServer;

    // Time Management
    timeStep = SOL_PHYSICS_SETTINGS.timeStep;
    lastTime = 0;
    accumulator = 0;
    focused = true;
    running = true;

    // Environment/Config
    url = location.hostname === "localhost"
        ? "ws://localhost:8080"
        : "wss://srv.solblade.online";
    canvas = document.getElementById("webgl");

    constructor() {
        this.loader = new SolLoading();
        this.renderer = new SolRender(this.canvas);
        this.input = new UserInput(this.canvas);
        this.game = new CGame(this.renderer.scene, this.renderer.camera, this.input, this.loader);
        this.setupBindings();
    }

    async start() {
        try {
            this.socket = await this._tryConnect();
        } catch {
            if (this.socket) this.socket.close();
            const serverSocket = new LocalServerTransport();
            this.socket = new LocalTransport();

            const { SGame } = await import("@solblade/server/core/SGame.js");
            this.localServer = new SGame(serverSocket);

            await this.localServer.start(false, this.socket);
        }
        await this.game.start();
        this.game.netBinds(this.socket);
        requestAnimationFrame(this.loop.bind(this));
    }

    // --- Core Game Loop (Fixed Time Step) ---
    // Use an arrow function for 'loop' to automatically bind 'this' without .bind(this)
    loop = (time) => {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;
        this.accumulator += dt;
        if (this.accumulator > 0.25) this.accumulator = 0.25;
        if (dt > 1) this.handleSleep();
        if (this.running) {
            // Fixed time step update (for physics/state management)
            while (this.accumulator >= this.timeStep) {
                if (this.localServer) this.localServer.step(this.timeStep);
                if (this.game) this.game.step(this.timeStep);
                this.accumulator -= this.timeStep;
            }
            if (this.localServer) this.localServer.tick(dt);
            if (this.game) this.game.tick(dt);
            if (this.renderer) this.renderer.render(dt);
        }
        requestAnimationFrame(this.loop);
    }
    _tryConnect() {
        return new Promise((resolve, reject) => {
            const tempSocket = io(this.url, {
                transports: ["websocket"],
                reconnection: false,
                timeout: 100,
            });

            tempSocket.on("connect", () => {
                resolve(tempSocket);
            });
            tempSocket.on("connect_error", (err) => {
                reject(err);
            });
        });
    }

    handleSleep() {
        if (this.focused) return;
        this.running = false;
    }

    setupBindings() {
        window.addEventListener("focus", () => {
            this.focused = true;
            this.running = true;
        });
        window.addEventListener("blur", () => {
            this.focused = false;
        });
    }
}

const app = new App();
await app.start();