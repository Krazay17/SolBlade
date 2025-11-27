import State from "./State.js";

export default class IdleState extends State {
    update(dt) {
        if (!this.movement?.isGrounded) return this.fsm.setState('fall');
        if (this.controller.inputDirection()) return this.fsm.setState('run');
        this.movement.idleMove(dt);
    }
}