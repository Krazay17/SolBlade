import Actor from "@solblade/common/actors/Actor";
import { Group } from "three";
import { SkeleSystem } from "./components/SkeleSystem";
import { AbilitySystem } from "@solblade/common/actors/abilities/AbilitySystem";

export class CActor extends Actor {
    constructor(data) {
        super(data);

        this.graphics = new Group();
        this.abilitySystem = new AbilitySystem(this);
        this.skeleSystem = new SkeleSystem(this);
    }
}