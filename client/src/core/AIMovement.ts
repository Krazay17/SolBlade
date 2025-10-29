import { Vector3 } from "three";
import Pawn from "../actors/Pawn";

export default class AIMovement {
    pawn: Pawn;
    tempVector: Vector3 = new Vector3;
    speed: number = 2;
    velocityBuffer: number = 0;
    lastPosition: Vector3 = new Vector3;
    tempVec: Vector3 = new Vector3;
    tempVec2: Vector3 = new Vector3;
    constructor(pawn: Pawn) {
        this.pawn = pawn;
        this.lastPosition.copy(this.pawn.position);
    }
    update(dt: number, time: number) {
        if (!this.pawn.body) return;
        const currentPos = this.tempVec.copy(this.pawn.position);
        const velocity = this.tempVec2.copy(currentPos).sub(this.lastPosition).divideScalar(dt);
        this.lastPosition.copy(currentPos);

        if (velocity.length() > 0.001) {
            this.velocityBuffer = 0;
            this.pawn.animationManager?.playAnimation('walk', true);
        } else {
            this.velocityBuffer = Math.min(this.velocityBuffer + dt, 1);
            if (this.velocityBuffer >= 0.1) {
                this.pawn.animationManager?.playAnimation('idle', true);
            }
        }
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
        const speedToPlayer = this.tempVector.copy(dir).multiplyScalar(this.speed);
        if (this.pawn.body) {
            this.pawn.body.body.setLinvel({ x: speedToPlayer.x, y: speedToPlayer.z, z: this.pawn.body.body.linvel().y }, true)
        }
    }
    still() {
        if (!this.pawn.body) return;
        this.pawn.body.body.setLinvel({ x: 0, y: 0, z: 0 }, false);
    }
}
function lerpAngle(a: number, b: number, t: number): number {
    let diff = b - a;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    return a + diff * t;
}