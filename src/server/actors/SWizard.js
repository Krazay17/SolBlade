import SAbilityMan from "../core/ability/SAbilityMan.js";
import SAIController from "../core/SAIController.js";
import SAIMovement from "../core/SAIMovement.js";
import SFSM from "../core/states/SFSM.js";
import SPawn from "./SPawn.js";

export default class SWizard extends SPawn {
    constructor(game, data) {
        super(game, data);
        this.fsm = new SFSM(game, this);
        this.abilities = new SAbilityMan(game, this);
        this.controller = new SAIController(game, this, { aggroRadius: 8 });
        this.movement = new SAIMovement(game, this, { speed: 30 });
    }
}