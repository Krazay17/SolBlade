import RAPIER from "@dimforge/rapier3d-compat";
import { UserInput } from "@solblade/client/core/UserInput.js";
import { io, Socket } from "socket.io-client";
import { SOL_PHYSICS_SETTINGS } from "@solblade/common/data/SolConstants.js";
import { LocalServerTransport } from "@solblade/common/net/LocalServerTransport.js";
import { LocalTransport } from "@solblade/common/net/LocalTransport.js";
import { CGame } from "./CGame.js";
import { SolLoading } from "./SolLoading.js";
import { SolRender } from "./SolRender.js";
import { CNet } from "./CNet.js";
/**
 * @typedef {import("@solblade/server/core/SGame.js").SGame}localServer
 */
await RAPIER.init();

class App {
    net: CNet;
    renderer;
    input;
    loader;
    game;
    localServer: any;

    // Time Management
    timeStep = SOL_PHYSICS_SETTINGS.timeStep;
    lastTime = 0;
    accumulator = 0;
    focused = true;
    running = true;
    canvas = document.getElementById("webgl");

    constructor() {
        this.loader = new SolLoading();
        this.net = new CNet();
        this.renderer = new SolRender(this.canvas);
        this.input = new UserInput(this.canvas);
        this.game = new CGame(this.renderer.scene, this.renderer.camera, this.input, this.loader);
        this.setupBindings();
    }

    async start() {
        this.game.start();
        try {
            await this.net.start();
        } catch {
            this.localServer = await this.net.startLocal();
        }
        await this.game.netConnect(this.net.socket);

        requestAnimationFrame(this.loop);
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