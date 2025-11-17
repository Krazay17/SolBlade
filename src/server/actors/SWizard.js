import SAIController from "../core/SAIController.js";
import SPawn from "./SPawn.js";

export default class SWizard extends SPawn {
    constructor(game, data) {
        super(game, data);
        this.controller = new SAIController(game, this, { aggroRadius: 8 });
        this.controller.closeRange = () => this.attack1()
    }
    attack1() {
        console.log('attack1');
    }
}