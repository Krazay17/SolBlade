import Game from "./GameCore.js";

export default class SolWorld {
    /**
     * 
     * @param {Game} game 
     */
    constructor(game) {
        this.game = game;

        this.pos = new Map();

        this.systems = [];
    }
    step(dt) {
        for (const s of this.systems) {
            s.step(dt);
        }
    }
    addSystem(system) {
        this.systems.push(system);
    }
}