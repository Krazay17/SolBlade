import Ability from "../abilities/Ability";
import State from "./State";

export class AttackState extends State {
    activeAbility: Ability;
    enter(state: string, params?: any): void {
        const { ability = null } = params;
        this.activeAbility = ability;
    }
    update(dt: any): void {
        if (this.activeAbility) this.activeAbility.tick(dt);
    }
}