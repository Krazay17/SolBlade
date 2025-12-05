import Pawn from "@solblade/common/actors/Pawn.js"
import FSM from "./FSM.js";
import { vectorsToLateralDegrees } from "@solblade/common/utils/Utils.js";

export default class State {
    /**
     * 
     * @param {FSM} fsm 
     * @param {Pawn} pawn 
     */
    constructor(fsm, pawn) {
        this.fsm = fsm;
        this.pawn = pawn;
        this.name = "state";
        this.canReEnter = false;
    }
    get controller() { return this.pawn.controller }
    get movement() { return this.pawn.movement }
    get animation() { return this.pawn.animation }
    setState(state, params) { this.fsm.setState(state, params) }
    enter(state, params) { }
    exit(state) { }
    update(dt) { }
    canEnter(state) { return true }
    canExit(state) { return true }

    pivot(useVel = false, moveDir = this.controller.direction, lookDir = this.pawn.aim().dir) {
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