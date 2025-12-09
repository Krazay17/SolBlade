import RAPIER from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";
import { Movement } from "./Movement.js";

export default class GroundChecker {
    movement: Movement;
    tempVec = new Vector3();
    downVec = new Vector3(0, -1, 0);
    ball: RAPIER.Ball;

    constructor(movement: Movement, radius) {
        this.movement = movement
        this.tempVec = new Vector3();
        this.ball = new RAPIER.Ball(radius * 1.4);

    }
    isGrounded(slope = -0.6) {
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
        if (!this.movement.owner.world.physics.world) return;
        const result = this.movement.owner.world.physics.world.castShape(
            this.movement.vecPos,
            { x: 0, y: 0, z: 0, w: 1 },
            this.downVec,
            this.ball,
            0,
            1.2,
            true,
            undefined,
            undefined,
            this.movement.owner.collider,
            this.movement.owner.body
        )

        return result;
    }
}