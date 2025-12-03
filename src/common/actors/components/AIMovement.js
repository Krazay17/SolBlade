import SolWorld from "@solblade/common/core/SolWorld.js";
import Pawn from "../Pawn.js";
import GroundChecker from "./GroundChecker.js";

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
    get isGrounded(){return this.groundChecker.isGrounded()}
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
        this.pawn.latVel = dir;
    }
    idleMove(dt){
        this.pawn.velocity = this.pawn.velocity.multiplyScalar(.9);
    }
}