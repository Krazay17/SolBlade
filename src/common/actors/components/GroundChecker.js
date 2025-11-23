import RAPIER from "@dimforge/rapier3d-compat";
import Pawn from "../Pawn";
import { Vect3 } from "../../../../common/utils/SolMath";
import SolWorld from "../../SolWorld";

export default class GroundChecker {
    /**
     * 
     * @param {SolWorld} world
     * @param {Pawn} pawn 
     */
    constructor(world, pawn) {
        this.world = world;
        this.pawn = pawn;

        this.downVec = { x: 0, y: -1, z: 0 };
        this.tempVec = new Vect3();
        this.ball = new RAPIER.Ball(this.pawn.radius);

    }
    isGrounded(slope = -0.7) {
        this.tempVec.set(0, 0, 0)
        const normal = this.getFloor()?.normal2;
        if (normal) this.tempVec.copy(normal);
        return this.tempVec.y < slope;
    }
    floorNormal() {
        this.tempVec.set(0, 0, 0)
        const normal = this.getFloor()?.normal2;
        if (normal) this.tempVec.copy(normal);
        return this.tempVec;
    }
    getFloor() {
        const result = this.game.physics.castShape(
            this.pawn.vecPos,
            { x: 0, y: 0, z: 0, w: 1 },
            this.downVec,
            this.ball,
            0,
            1.2,
            true,
            undefined,
            undefined,
            this.pawn.collider,
            this.pawn.body
        )

        return result;
    }
}