import Game from "./GameCore.js";

export default class SolWorld {
    /**
     * 
     * @param {Game} game 
     */
    constructor(game, sceneName = "scene3") {
        this.game = game;
        this.sceneName = sceneName;

        this.pos = new Map();
        this.systems = [];


        this.actors = [];
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