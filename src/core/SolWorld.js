import GameCore from "./GameCore.js";

export default class SolWorld {
    /**
     * 
     * @param {GameCore} game 
     */
    constructor(game, worldName = "scene2") {
        this.game = game;
        this.worldName = worldName;

        this.actors = [];
    }
    fixedStep(dt) { }
}