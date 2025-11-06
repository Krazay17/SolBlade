import { Vector3 } from "three";
import Pawn from "../actors/CPawn";
import GroundChecker from "../player/GroundChecker";
import PawnBody from "./PawnBody";

type MovementValues = {
    [key: string]: MovementState;
};
type MovementState = {
    speed: number;
    accel: number;
    friction: number;
};
export default class MovementManager {
    pawn: Pawn;
    body: PawnBody | null = null;
    groundChecker: GroundChecker;
    groundFriction: number;
    values: MovementValues;

    constructor(pawn: Pawn) {
        this.pawn = pawn;
        this.body = pawn.pawnBody;
        this.groundChecker = new GroundChecker(pawn, 1, pawn.radius)

        this.groundFriction = 1;
        this.values = {
            idle: { speed: 0, accel: 0, friction: 10 },
            ground: { speed: 6, accel: 30, friction: 10 },
            air: { speed: 1, accel: 10, friction: 5 },
            blade: { speed: 12, accel: 30, friction: 15 },
        };
    }
    applyFriction(dt: number, friction: number, expo: boolean = true) {
        if(!this.body) return;
        const v = this.body.velocity;
        const speed = v.length();
        if (speed < 0.0001) return;

        const drop = expo ? friction * dt * speed : friction * dt;
        const newSpeed = Math.max(speed - drop, 0);

        const scale = newSpeed / speed;
        this.body.velocity = v.multiplyScalar(scale);
    }
    accelerate(dt: number, wishDir: Vector3, wishSpeed: number, accel: number) {
        if(!this.body) return;
        const v = this.body.velocity;
        const vXY = v.clone();
        vXY.y = 0;
        const wishDirSpeed = vXY.dot(wishDir);
        const addSpeed = wishSpeed - wishDirSpeed;
        const accelSpeed = Math.min(accel * wishSpeed * dt, addSpeed);

        this.body.velocity = {x:v.x += accelSpeed, y: v.y, z: v.z += accelSpeed};
    }
    getInputDirection() {

    }
    groundMove(dt: number) {
        this.applyFriction(dt, this.values['ground'].friction);
        // const wishDir = this.getInputDirection();
        // const wishSpeed = this.values['ground'].speed;
        // const accel = this.values['ground'].accel;
        // this.accelerate(dt, wishDir, wishSpeed, accel);
    }
}