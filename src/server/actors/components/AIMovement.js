import SolWorld from "@solblade/common/core/SolWorld.js";
import GroundChecker from "@solblade/common/actors/components/GroundChecker.js";
import { SActor } from "../SActor";

export default class AIMovement {
    /**
     * @param {SolWorld} world
     * @param {SActor} owner
     */
    constructor(owner) {
        this.owner = owner;
        this.groundChecker = new GroundChecker(this.owner);
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
        this.owner.velocity = dir;
    }
    airMove(dt, dir) {
        this.owner.latVel = dir;
    }
    idleMove(dt){
        this.owner.velocity = this.owner.velocity.multiplyScalar(.9);
    }
}