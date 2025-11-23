import State from "./State.js";

export default class AttackState extends State {
    enter(state, params = {}) {
        const { ability } = params
        this.ability = ability;
    }
}