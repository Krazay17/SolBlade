import RAPIER from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";
import { Movement } from "./Movement.js";
import SolWorld from "@solblade/common/core/SolWorld.js";

export default class GroundChecker {
    movement: Movement;
    world: SolWorld;
    tempVec = new Vector3();
    downVec = new Vector3(0, -1, 0);
    ball: RAPIER.Ball;

    constructor(movement: Movement, radius?: number) {
        this.movement = movement
        this.tempVec = new Vector3();
        this.ball = new RAPIER.Ball(radius);

    }
    isGrounded(slope = -0.6) {
        const normal = this.getFloor()?.normal2;
        if (!normal) return false;
        this.tempVec.set(0, 0, 0)
        this.tempVec.copy(normal);
        return this.tempVec.y < slope;
    }
    floorNormal() {
        const normal = this.getFloor()?.normal2;
        if (!normal) return false
        this.tempVec.set(0, 0, 0)
        this.tempVec.copy(normal);
        return this.tempVec;
    }
    getFloor() {
        if (!this.movement.actor.world.physics.world) return;
        const result = this.movement.actor.world.physics.world.castShape(
            this.movement.vecPos,
            { x: 0, y: 0, z: 0, w: 1 },
            this.downVec,
            this.ball,
            0,
            1.2,
            true,
            undefined,
            undefined,
            this.movement.actor.collider,
            this.movement.actor.body
        )

        return result;
    }
}