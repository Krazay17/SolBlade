import State from "@solblade/common/actors/states/State";
import type { Player } from "@solblade/common/core/Interfaces";

export default class AttackState extends State<Player> {
    ability: any;
    enter(state, params) {
        const { ability } = params
        this.ability = ability;
    }
}