import AttackState from "./AttackState";
import DeadState from "./DeadState";
import FallState from "./FallState";
import IdleState from "./IdleState";
import { JumpState } from "./JumpState";
import RunState from "./RunState";

export const playerStateRegistry = {
    idle: IdleState,
    run: RunState,
    fall: FallState,
    jump: JumpState,
    attack: AttackState,
    dead: DeadState
}