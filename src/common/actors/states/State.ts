import FSM from "@solblade/common/actors/states/FSM.js";
import { vectorsToLateralDegrees } from "@solblade/common/utils/Utils.js";
import Actor from "../Actor";

export default class State {
    fsm: FSM;
    actor: Actor;
    name: string = "state";
    canReEnter: boolean = false;
    enterTime = 0;
    duration = 0;
    cd = 0;
    constructor(fsm: FSM, actor: Actor) {
        this.fsm = fsm;
        this.actor = actor;
    }
    get controller() { return this.actor.controller }
    get movement() { return this.actor.movement }
    get animation() { return this.actor.animation }
    setState(state: string, params?: any) { this.fsm.setState(state, params) }
    enter(state: string, params: any = {}) { }
    exit(state) { }
    update(dt) { }
    canEnter(state) { return true }
    canExit(state) { return true }

    pivot(useVel = false, moveDir = this.controller.direction, lookDir = this.actor.aim?.().dir) {
        if (useVel) {
            moveDir = this.movement.velocity;
            const lateral = Math.atan2(moveDir.x, moveDir.z);
            if (lateral === 0) return "Neutral";
            moveDir.normalize();
        }
        if(!lookDir)return "Front";
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