import GameCore from "../GameCore";
import Actor from "./Actor.js";

export default class Pawn extends Actor {
    /**
     * 
     * @param {GameCore} game 
     * @param {*} data 
     */
    constructor(game, data){
        super(data);
        this.game = game;

        this.isRemote = false;
    }
}