import SPawn from "../../actors/SPawn.js";
import SGame from "../../SGame.js";
import AttackState from "./AttackState.js";
import ChaseState from "./ChaseState.js";
import FallState from "./FallState.js";
import FireballState from "./FireballState.js";
import IdleState from "./IdleState.js";
import RunState from "./RunState.js";

const stateRegistry = {
    fireball: FireballState,
}

export default class SFSM {
    constructor(game, pawn, data = {}) {
        const {
            attacks = ['fireball'],
        } = data;
        /**@type {SGame} */
        this.game = game;
        /**@type {SPawn} */
        this.pawn = pawn;

        this.states = {
            idle: new IdleState(game, pawn, data),
            chase: new ChaseState(game, pawn, data),
        };
        this.state = this.states['idle'];

        this.attackStates = {}

        for (const a of attacks) {
            const aClass = stateRegistry[a];
            if (aClass) this.attackStates[a] = new aClass(game, pawn);
        }
    }
    setState(state, params) {
        const lastState = this.state.name;
        if (state === lastState && !this.state.reEnter) return false
        const newState =
            this.states[state] ||
            this.attackStates[state];
        if (!newState) return;
        
        if (state !== "dead") {
            if (!this.state.canExit()) return false;
            if (!newState.canEnter()) return false;
        }

        this.state.exit(state);
        this.state = newState;
        this.state.enter(lastState, params);

        this.pawn.stateChanged = true;

        return true;
    }
    tryAttack(dist, params) {
        for (const [name, attack] of Object.entries(this.attackStates)) {
            if (attack.canEnter(dist)) {
                this.setState(name, params);
                return true;
            }
        }
        return false;
    }
    update(dt) {
        if (this.state) this.state.update(dt);
    }
}