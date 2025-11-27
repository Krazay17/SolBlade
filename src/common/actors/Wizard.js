import FSM from "./states/FSM.js";
import AIController from "./components/AIController.js";
import AIMovement from "./components/AIMovement.js";
import Pawn from "./Pawn.js";

export default class Wizard extends Pawn {
    constructor(world, data) {
        super(world, {
            ...data,
            name: "wizard"
        });
        this.controller = new AIController(world, this);
        this.movement = new AIMovement(world, this);
        this.fsm = new FSM(this, [
            "patrol"
        ])
        console.log("SERVER WIZARD");
    }
}