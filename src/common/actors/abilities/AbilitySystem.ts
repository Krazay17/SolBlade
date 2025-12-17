import { Actor } from "../Actor";
import { Component } from "../components/_Component";
import Ability from "./Ability";
import { Fireball } from "./Fireball";

const abilityReg = {
    fireball: Fireball,
}

export class AbilitySystem extends Component {
    abilities: Map<number, Ability> = new Map();
    constructor(actor: Actor, abs: string[]) {
        super(actor);
        this.addAbility(abs);
    }
    addAbility(a: string | string[]) {
        const insertA = (s: string) => {
            let indx = this.abilities.size;
            const cls = abilityReg[s];
            if (!cls) return;
            this.abilities.set(indx, new cls(this.actor));
        }
        if (a instanceof Array) {
            for (const s of a) {
                insertA(s);
            }
        } else {
            insertA(a);
        }
    }
    assignAbility(index: number, ability: string) {
        const cls = abilityReg[ability];
        if (!cls) return;
        this.abilities.set(index, new cls(this.actor));
    }
    useRandom(){
        this.abilities.forEach((v)=>{
            v.use();
        })
    }
}