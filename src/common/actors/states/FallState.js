import State from "./State";

export default class FallState extends State {
    update(dt) {
        if(!this.movement || !this.controller)return;
        if (this.movement?.isGrounded) return this.setState('idle');
        const dir = this.controller.inputDirection();
        this.movement.airMove(dt, dir);
    }
}