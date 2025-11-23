import State from "./State";

export default class FallState extends State {
    update(dt) {
        console.log(this.movement.isGrounded)
        if (this.movement.isGrounded) return this.setState('idle');
        const dir = this.controller.inputDirection();
        this.movement.airMove(dt, dir);
    }
}