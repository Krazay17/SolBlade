import { Group } from "three";
import Actor from "@solblade/common/actors/Actor";

export class RActor extends Actor {
    constructor(data) {
        super(data);

        this.graphics = new Group();
        this.animtionSystem = null;
    }
}