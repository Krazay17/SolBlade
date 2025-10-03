import { Vector3 } from "three";
import Pawn from "../actors/Pawn";
import { lerp } from "three/src/math/MathUtils.js";
import { Body, Vec3 } from "cannon-es";
import { threeVecToCannon } from "../utils/Utils";

export default class AIMovement {
    pawn: Pawn;
    body: Body | null;
    tempVec: Vec3 = new Vec3();
    tempVector: Vector3 = new Vector3;
    speed: number = 2;
    constructor(pawn: Pawn) {
        this.pawn = pawn;
        this.body = pawn.body;
    }
    setSpeed(speed: number) {
        this.speed = speed;
    }
    rotateToTarget(dir: Vector3, speed: number = 0.02) {
        const angle = Math.atan2(dir.x, dir.z);
        this.pawn.rotation.y = lerpAngle(this.pawn.rotation.y, angle, speed);
    }
    walkToTarget(dir: Vector3) {
        this.rotateToTarget(dir);
        const speedToPlayer = threeVecToCannon(this.tempVector.copy(dir).multiplyScalar(this.speed));
        if (this.body) {
            this.body.velocity.x = speedToPlayer.x;
            this.body.velocity.z = speedToPlayer.z;
        }
    }
    still() {
        this.body?.velocity.setZero();
    }
}
function lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
}