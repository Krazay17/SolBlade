import SAbilityMan from "../core/ability/SAbilityMan.js";
import SAIController from "../core/SAIController.js";
import SAIMovement from "../core/SAIMovement.js";
import SFSM from "../core/states/SFSM.js";
import SPawn from "./SPawn.js";

export default class SWizard extends SPawn {
    constructor(game, data) {
        super(game, data);
        this.fsm = new SFSM(game, this);
        this.controller = new SAIController(game, this, { aggroRadius: 25 });
        this.movement = new SAIMovement(game, this, { speed: 30, turnSpeed: 5 });

        this.auth = true;
        this.stunned = false;
    }
    hit(data) {
        super.hit(data);
        this.health.subtract(data.amount);
        if (data.impulse) {
            if (this.body) this.body.setLinvel({ x: data.impulse[0], y: data.impulse[1], z: data.impulse[2] }, true);
            this.stunned = true;
            setTimeout(() => this.stunned = false, 600);
        }
        return data.amount;
    }
}