import { GameState } from "./GameState.js";
import { Physics } from "./Physics.js";

export default class SolWorld {
    /**
     * 
     * @param {String} name 
     */
    constructor(name) {
        this.name = name;

        this.gameState = new GameState();
        this.physics = new Physics(this.gameState);
    }
    async start() { }
    step(dt) { }
    tick(dt) { }
    exit() { }
}