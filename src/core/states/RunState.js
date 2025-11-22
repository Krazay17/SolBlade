import State from "./State";

export default class RunState extends State {
    update(dt) {
        if (!this.movement.isGrounded) return this.setState('fall');
        const dir = this.controller.inputDirection();
        if (!dir) return this.setState('idle');
        this.movement.groundMove(dt, dir);
    }
}