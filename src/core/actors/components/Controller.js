import SolWorld from "../../SolWorld";
import Pawn from "../Pawn";

export default class Controller {
    /**
     * @param {SolWorld} world
     * @param {Pawn} pawn 
     */
    constructor(world, pawn) {
        this.world = world
        this.pawn = pawn;
    }
    inputDirection(){}
}