import { AbilitySystem } from "./abilities/AbilitySystem.js";
import Actor from "./Actor.js";

export class SActor extends Actor {
    constructor(data){
        super(data);

        this.abilitySystem = new AbilitySystem(this);
    }
}