import { Pawn } from "@solblade/common/core/Interfaces";
import FSM from "@solblade/common/actors/states/FSM.js";
import { vectorsToLateralDegrees } from "@solblade/common/utils/Utils.js";

export default class State<T extends Pawn> {
    fsm: FSM<T>;
    owner: T;
    name: string = "state";
    canReEnter: boolean = false;
    enterTime = 0;
    duration = 0;
    cd = 0;
    constructor(fsm: FSM<T>, owner: T) {
        this.fsm = fsm;
        this.owner = owner;
    }
    get controller(): T['controller'] { return this.owner.controller }
    get movement() { return this.owner.movement }
    get animation() { return this.owner.animation }
    setState(state: string, params?: any) { this.fsm.setState(state, params) }
    enter(state: string, params: any = {}) { }
    exit(state) { }
    update(dt) { }
    canEnter(state) { return true }
    canExit(state) { return true }

    pivot(useVel = false, moveDir = this.controller.direction, lookDir = this.owner.aim().dir) {
        if (useVel) {
            moveDir = this.movement.velocity;
            const lateral = Math.atan2(moveDir.x, moveDir.z);
            if (lateral === 0) return "Neutral";
            moveDir.normalize();
        }
        let angleDeg = vectorsToLateralDegrees(lookDir, moveDir);
        const sector = Math.floor((angleDeg + 22.5) / 45) % 8;
        switch (sector) {
            case 0: return "Front";
            case 1: return "Front";
            case 2: return "Right";
            case 3: return "Right";
            case 4: return "Back";
            case 5: return "Left";
            case 6: return "Left";
            case 7: return "Front";
        }
    }
}