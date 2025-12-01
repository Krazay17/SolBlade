import { SOL_PHYSICS_SETTINGS } from "../config/SolConstants.js";
import { CGame } from "./CGame.js";
import { CNet } from "./CNet.js";
import UserInput from "@solblade/client/input/UserInput.js";
import { SolRender } from "./SolRender.js";


class App {
    // --- Application State Properties (Using Class Fields) ---
    renderer;
    input;
    game;
    net;

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
        this.canvas = document.getElementById("webgl");
        this.renderer = new SolRender(this.canvas);
        this.input = new UserInput(this.canvas);
        this.game = new CGame(this.renderer.scene, this.renderer.camera, this.input);
        this.net = new CNet(this.url, this.game);

        this.setupBindings();

        this.start();
    }

    async start() {
        await this.net.start();
        await this.game.start();
        requestAnimationFrame(this.loop.bind(this));
    }

    // --- Core Game Loop (Fixed Time Step) ---
    // Use an arrow function for 'loop' to automatically bind 'this' without .bind(this)
    loop = (time) => {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;
        this.accumulator = Math.min(this.accumulator + dt, 0.25);
        if (dt > 1) this.handleSleep();
        if (this.running) {
            const userCommand = this.game.getUserCommand();
            if (userCommand) {
                this.net.sendUserCommand(userCommand);
            }
            // Fixed time step update (for physics/state management)
            while (this.accumulator >= this.timeStep) {
                if (this.net.localServer) this.net.localServer.step(this.timeStep);
                if (this.game) this.game.step(this.timeStep);
                this.accumulator -= this.timeStep;
            }
            // Variable time step update (for rendering/interpolation)
            if (this.game) this.game.tick(dt);
            // Render
            if (this.renderer) this.renderer.render();
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
new App();