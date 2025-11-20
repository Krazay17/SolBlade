import Game from "./Game.js";
import Velocity from "./systems/Velocity.js";

export default class SolWorld {
    /**
     * 
     * @param {Game} game 
     */
    constructor(game){
        this.game = game;

        this.systems = [
            new Velocity(this),
        ]
    }
    update(dt) {
        for (const s of this.systems){
            s.update(dt);
        }
    }
}