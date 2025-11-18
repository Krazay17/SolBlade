import SPawn from "../../actors/SPawn.js";
import SGame from "../../SGame.js";
import SASM from "../ability/SAbilityMan.js";
import SAIMovement from "../SAIMovement.js";
import SFSM from "./SFSM.js";

export default class State {
    constructor(game, pawn, data = {}) {
        const {
            name = 'state',
            ai = true,
            cd = 0,
            duration = 0,
            reEnter = false,
        } = data;
        /**@type {SGame} */
        this.game = game;
        /**@type {SPawn} */
        this.pawn = pawn;

        this.name = name;
        this.ai = ai;
        this.cd = cd;
        this.duration = duration;
        this.reEnter = reEnter;

        this.lastEnter = 0;
        this.elapsed = 0;
    }
    /**@type {SFSM} */
    get fsm() { return this.pawn.fsm }
    get animation() { return this.pawn.animationManager }
    /**@type {SAIMovement} */
    get movement() {
        return this.pawn.movement
    };
    /**@type {SASM} */
    get abilities() { return this.pawn.abilities }
    get blackboard() { return this.pawn.controller.blackboard }
    setState(state, params) {
        this.pawn.fsm.setState(state, params);
    }
    enter(prevState) {
        this.lastEnter = performance.now();
    }
    update(dt) { }
    exit(nextState) { }
    canEnter() { return this.lastEnter + this.cd < performance.now() }
    canExit() { return this.lastEnter + this.duration < performance.now() }
}