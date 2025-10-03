import Pawn from "../actors/Pawn";
import { Body, Vec3 } from "cannon-es";
import GroundChecker from "../player/GroundChecker";

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
    body: Body | null = null;
    tempVec: Vec3;
    tempVec2: Vec3;
    groundChecker: GroundChecker;
    groundFriction: number;
    values: MovementValues;

    constructor(pawn: Pawn) {
        this.pawn = pawn;
        this.body = pawn.body;
        this.tempVec = new Vec3();
        this.tempVec2 = new Vec3();
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
        const speed = this.body.velocity.length();
        if (speed < 0.0001) return;

        const drop = expo ? friction * dt * speed : friction * dt;
        const newSpeed = Math.max(speed - drop, 0);

        const scale = newSpeed / speed;
        this.body.velocity.scale(scale, this.body.velocity);
    }
    accelerate(dt: number, wishDir: Vec3, wishSpeed: number, accel: number) {
        if(!this.body) return;
        this.tempVec.copy(this.body.velocity);
        this.tempVec.y = 0;
        const wishDirSpeed = this.tempVec2.dot(wishDir);
        const addSpeed = wishSpeed - wishDirSpeed;
        const accelSpeed = Math.min(accel * wishSpeed * dt, addSpeed);

        this.body.velocity.addScaledVector(accelSpeed, wishDir, this.body.velocity);

    }
    getInputDirection() {

    }
    groundMove(dt: number) {
        this.applyFriction(dt, this.values['ground'].friction);
        // const wishDir = this.getInputDirection();
        // const wishSpeed = this.values['ground'].speed;
        // const accel = this.values['ground'].accel;
        // this.accelerate(dt, wishDir, wishSpeed, accel);
        const projectOntoFloor = this.tempVec.dot(this.groundChecker.floorNormal())
    }
}