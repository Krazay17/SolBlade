import SAIController from "../core/SAIController.js";
import SAIMovement from "../core/SAIMovement.js";
import SFSM from "../core/states/SFSM.js";
import SPawn from "./SPawn.js";

export default class SWizard extends SPawn {
    constructor(game, data) {
        super(game, data);
        this.fsm = new SFSM(game, this)
        this.controller = new SAIController(game, this, { aggroRadius: 8 });
        this.movement = new SAIMovement(game, this, { speed: 30 });

        this.rangeActions = {
            close: [
                { name: "melee", execute: () => this.attack1() }
            ],
            med: [
                { name: "fireball", execute: () => this.attack2() }
            ],
            far: [
                { name: "heal", execute: () => this.attack3() }
            ]
        }
    }
    attack1() {
        console.log('attack1');
    }
    attack2() {
        console.log('attack2');
    }
    attack3() {
        console.log('attack3');
    }
}