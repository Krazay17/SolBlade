import State from "./_PlayerState";

export default class AttackState extends State {
    enter(state, params = {}) {
        const { ability } = params
        this.ability = ability;
    }
}