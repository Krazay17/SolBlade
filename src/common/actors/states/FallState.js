import State from "./State.js";

export default class FallState extends State {
    update(dt) {
        if (this.movement.groundChecker.isGrounded()) return this.setState('idle');
        const dir = this.controller.inputDirection();
        this.movement.airMove(dt, dir);
    }
}