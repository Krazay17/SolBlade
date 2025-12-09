import { SkeleSystem } from "@solblade/client/actors/components/SkeleSystem";
import Actor from "./Actor";
import Controller from "./components/Controller";
import { Movement } from "./components/Movement";
import FSM from "./states/FSM";

export class Pawn extends Actor {
    controller?: Controller;
    movement?: Movement;
    animation?: SkeleSystem;
    fsm?: FSM;
    constructor(data: any = {}) {
        super(data);
    }
    aim() {
        return {
            dir: null,
        }
    }
}