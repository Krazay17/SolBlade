import State from "./State";

export default class WalkState extends State {
    enter(params?: any): void {
        const anim = this.pawn.animationManager?.playAnimation('walk', true);
        console.log(anim?.duration);

    }
    update(dt: number, time: number): void {
        this.pawn.animationManager?.playAnimation('walk', true);
        const dir = this.pawn.controller?.target.dir
        if (dir) {
            this.movement.walkToTarget(dir);
        }
    }
}