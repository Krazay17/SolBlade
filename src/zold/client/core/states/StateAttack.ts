import Player from "../../player/Player";
import State from "./State";
import { MovementStates } from "./StateManager";

export default class StateAttack extends State {
    target: Player | null = null;
    enter(params?: any): void {
        this.lastEnter = performance.now();
        const anim = this.pawn.animationManager?.playAnimation('attack', false);
        this.duration = (anim?.duration ?? 1) * 500;
    }
    update(dt: number, time: number): void {
        const { dir } = this.pawn.controller?.target;
        if (dir) {
            this.movement.rotateToTarget(dir, 0.01);
        }
        this.movement.still();
        if (time > this.lastEnter + this.duration) {
            this.manager.setState(MovementStates.Idle);
        }
    }
    canEnter(): boolean {
        return performance.now() > this.lastEnter + this.duration + this.cooldown;
    }
    canExit(): boolean {
        return performance.now() > this.lastEnter + this.duration;
    }
}