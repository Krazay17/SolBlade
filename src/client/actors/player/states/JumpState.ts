import State from "@solblade/common/actors/states/State";
import { Player } from "@solblade/common/core/Interfaces";

export class JumpState extends State<Player> {
    enter(state: any, params: any): void {
        this.enterTime = performance.now();
        this.duration = 500;
        this.movement.jumpStart();
        this.animation.playAnimation("jump", false);
    }
    update(dt: any): void {
        const now = performance.now();
        if (now > this.duration + this.enterTime) return this.setState("idle");
        const dir = this.controller.inputDirection();
        if(!dir)return;
        this.movement.smartMove(dt, dir);
    }
}