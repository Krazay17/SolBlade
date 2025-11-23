import FSM from "../states/FSM";
import AIController from "./components/AIController";
import AIMovement from "./components/AIMovement";
import Pawn from "./Pawn";

export default class Wizard extends Pawn {
    constructor(world, data) {
        super(world, {
            ...data,
            name: "wizard"
        });
        this.controller = new AIController(world, this);
        this.movement = new AIMovement(world, this);
        this.fsm = new FSM(this.world, this, [
            "patrol"
        ])
    }
}