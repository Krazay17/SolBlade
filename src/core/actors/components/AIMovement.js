import SolWorld from "../../SolWorld";
import Pawn from "../Pawn";
import GroundChecker from "./GroundChecker";

export default class AIMovement {
    /**
     * @param {SolWorld} world
     * @param {Pawn} pawn 
     */
    constructor(world, pawn) {
        this.world = world;
        this.pawn = pawn;
        this.groundChecker = new GroundChecker(this.world, this.pawn);
        //this.isGrounded = true;
    }
    update(dt) { }
    smartMove(dt, dir) {
        if (this.groundChecker.isGrounded()) {
            this.groundMove(dt, dir);
        } else {
            this.airMove(dt, dir);
        }
    }
    groundMove(dt, dir) {
        this.pawn.velocity = dir;
    }
    airMove(dt, dir) {
        this.pawn.velocity = dir;
    }
}