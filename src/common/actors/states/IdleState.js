import State from "./State.js";

export default class IdleState extends State {
    enter(state, params){
        if (!this.movement?.isGrounded) return this.fsm.setState('fall');
    }
    update(dt) {
        if (!this.movement?.isGrounded) return this.fsm.setState('fall');
        if (this.controller.inputDirection()) return this.fsm.setState('run');
        this.movement.idleMove(dt);
    }
}