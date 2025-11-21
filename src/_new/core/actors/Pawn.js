import GameCore from "../GameCore.js";
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

        this.controller = null;
        this.movement = null;
        this.fsm = null;
        this.abilit = null;
    }
    step(dt){
        
    }
}