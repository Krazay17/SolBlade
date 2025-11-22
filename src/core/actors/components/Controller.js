import GameCore from "../../GameCore";
import Pawn from "../Pawn";

export default class Controller {
    /**
     * @param {GameCore} game
     * @param {Pawn} pawn 
     */
    constructor(game, pawn) {
        this.game = game;
        this.pawn = pawn;
    }
    inputDirection(){}
}