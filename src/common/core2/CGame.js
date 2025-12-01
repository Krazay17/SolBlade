import { GameState } from "./GameState.js";
import { Graphics } from "./Graphics.js";

export class CGame {
    constructor(scene, camera, input) {
        this.scene = scene;
        this.camera = camera;
        this.input = input;
        this.gameState = new GameState();
        this.graphics = new Graphics(this.gameState);

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
    worldSnapshot(data) {
        console.log(data);
    }
}