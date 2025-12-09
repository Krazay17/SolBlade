import State from "@solblade/common/actors/states/State";

export default class AttackState extends State {
    ability: any;
    enter(state, params) {
        const { ability } = params
        this.ability = ability;
    }
}