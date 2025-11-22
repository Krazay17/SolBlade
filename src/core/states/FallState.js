import State from "./State";

export default class FallState extends State {
    update(dt) {
        if (this.movement.isGrounded) return this.setState('idle');
        this.movement.airMove(dt);
    }
}