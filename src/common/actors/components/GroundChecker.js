import RAPIER from "@dimforge/rapier3d-compat";
import { Vector3 } from "three";
import Actor from "../Actor.js";

export default class GroundChecker {
    /**
     * 
     * @param {Actor} owner 
     */
    constructor(owner) {
        this.owner = owner;

        this.tempVec = new Vector3();
        this.downVec = { x: 0, y: -1, z: 0 };
        this.ball = new RAPIER.Ball(this.owner.radius * 1.4);

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
        if (!this.owner.world) return;
        return;
        const result = this.owner.world.physics.world.castShape(
            this.owner.vecPos,
            { x: 0, y: 0, z: 0, w: 1 },
            this.downVec,
            this.ball,
            0,
            1.2,
            true,
            undefined,
            undefined,
            this.owner.collider,
            this.owner.body
        )

        return result;
    }
}