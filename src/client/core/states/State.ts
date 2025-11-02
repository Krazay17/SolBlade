import Pawn from "../../actors/Pawn";
import AIMovement from "../AIMovement";
import StateManager from "./StateManager";
export default class State {
    pawn: Pawn;
    manager: StateManager;
    duration: number = 0;
    cooldown: number = 0;
    lastEnter: number = 0;
    movement: AIMovement;
    constructor(pawn: Pawn, manager: StateManager) {
        this.pawn = pawn;
        this.manager = manager
        this.movement = pawn.movement as AIMovement;
    }
    update(dt: number, time: number, params?: any) { }
    enter(params?: any) { }
    exit() { }
    canExit(): boolean { return true; }
    canEnter(): boolean { return performance.now() > this.lastEnter + this.cooldown; }
    setCooldown(cd: number) { this.cooldown = cd; }
}