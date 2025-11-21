import Pawn from "../../actors/CPawn";
import * as STATES from ".";
import State from "./State";

export enum MovementStates {
    Idle,
    Walk,
    Attack
};
export default class StateManager {
    pawn: Pawn;
    currentState: State | null = null;
    currentStateName: MovementStates = MovementStates.Idle;
    stateInstances: Map<MovementStates, State> = new Map();

    constructor(pawn: Pawn) {
        this.pawn = pawn;
        this.stateInstances.set(MovementStates.Idle, new STATES.IdleState(pawn, this));
        this.stateInstances.set(MovementStates.Walk, new STATES.WalkState(pawn, this));
        this.stateInstances.set(MovementStates.Attack, new STATES.StateAttack(pawn, this));
        this.currentState = this.stateInstances.get(MovementStates.Idle) || null;
    }
    destroy() {
        this.pawn = null as any;
        this.currentState = null;
    }
    update(dt: number, time: number, params?: any) {
        if (this.currentState) {
            this.currentState.update(dt, time, params);
        }
    }
    setState(newState: MovementStates, params?: any) {
        if (this.currentState === this.stateInstances.get(newState)) return;
        if (!this.stateInstances.get(newState)?.canEnter()) return;
        if (this.currentState && !this.currentState.canExit()) return;
        if (this.currentState) {
            this.currentState.exit();
        }
        this.currentState = this.stateInstances.get(newState) || null;
        this.currentStateName = newState;
        if (this.currentState) {
            this.currentState.enter(params);
        }
    }
    canEnter(state: MovementStates = this.currentStateName) {
        return this.stateInstances.get(state)?.canEnter()
    }
    canExit(state: MovementStates = this.currentStateName) {
        return this.stateInstances.get(state)?.canExit()
    }
}