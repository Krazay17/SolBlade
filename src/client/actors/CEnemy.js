import AIMovement from "../core/AIMovement";
import NamePlate from "../core/Nameplate";
import StateManager from "../core/states/StateManager";
import CPawn from "./CPawn";

export default class CEnemy extends CPawn {
    stateManager;
    constructor(game, data) {
        super(game, data);
        this.movement = new AIMovement(this);
        this.stateManager = new StateManager(this);
        //this.controller = new AIController(game, this);
        this.namePlate = new NamePlate(this, this.height / 3 + 1);
    }
    fixedUpdate(dt, time) {
        super.fixedUpdate(dt, time);
        if (this.isRemote) {
            this.movement?.update(dt, time);
        }
    }
    applyDie() {
        this.destroy();
    }
}