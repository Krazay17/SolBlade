import Actor from "../Actor"

export class AbilitySystem {
    owner: Actor
    constructor(owner: Actor, abilities: string[]){
        this.owner = owner;
        this.addAbilities(abilities);
    }
    addAbilities(abilities = []){
        
    }
}