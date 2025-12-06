import AttackState from "./AttackState";
import DeadState from "./DeadState";
import FallState from "./FallState";
import IdleState from "./IdleState";
import RunState from "./RunState";

export const playerStateRegistry = {
    idle: IdleState,
    run: RunState,
    fall: FallState,
    attack: AttackState,
    dead: DeadState
}