import { GameState } from "./GameState.js";
import { Graphics } from "./Graphics.js";
import { Physics } from "./Physics.js";

export class CGame {
    constructor(scene, camera, input) {
        this.scene = scene;
        this.camera = camera;
        this.input = input;
        this.gameState = new GameState();
        this.graphics = new Graphics(this.gameState);
        this.physics = new Physics(this.gameState);
        this.player = { id: "player", worldName: "world1" };
    }
    async start() {

    }
    tick(dt) {
    }
    step(dt) {

    }
    getUserCommand() {
        return null;
    }
}