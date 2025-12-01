import RAPIER from "@dimforge/rapier3d-compat";
import CPawn from "../CPawn.js";
import { Vector3 } from "three";

export default class GroundChecker {
    /**
     * 
     * @param {CPawn} pawn 
     */
    constructor(pawn) {
        this.pawn = pawn;

        this.downVec = new Vector3(0, -1, 0);
        this.tempVec = new Vector3();
        this.ball = new RAPIER.Ball(this.pawn.radius * 0.9);

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
        if (!this.pawn.world?.physics?.world) return;
        const result = this.pawn.world.physics.world.castShape(
            this.pawn.vecPos,
            { x: 0, y: 0, z: 0, w: 1 },
            this.downVec,
            this.ball,
            0,
            1.5,
            true,
            undefined,
            undefined,
            this.pawn.collider,
            this.pawn.body
        )

        return result;
    }
}