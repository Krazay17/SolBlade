// Client/CMain.js

import * as THREE from "three";
import { SOL_PHYSICS_SETTINGS } from "../config/SolConstants";
import { CGame } from "./CGame";
import { CNet } from "./CNet";
import UserInput from "@solblade/client/input/UserInput";

class App {
    // --- Application State Properties (Using Class Fields) ---
    renderer;
    scene;
    camera;
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
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 1000);
        this.scene.add(this.camera);

        this.input = new UserInput(this.canvas);
        this.game = new CGame(this.scene, this.camera, this.input);
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
            if (this.renderer) this.renderer.render(this.scene, this.camera);
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
        window.addEventListener("resize", this.handleResize);
    }

    handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        if (this.camera) {
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
        }
        if (this.renderer) {
            this.renderer.setSize(w, h);
        }
    }
}
new App();