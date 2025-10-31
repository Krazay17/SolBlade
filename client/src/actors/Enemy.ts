import AIController from "../core/AIController";
import AIMovement from "../core/AIMovement";
import NamePlate from "../core/Nameplate";
import StateManager from "../core/states/StateManager";
import Game from "../Game";
import Pawn from "./Pawn";

export default class Enemy extends Pawn {
    stateManager: StateManager | null;
    constructor(
        game: Game,
        data: any = {},
    ) {
        super(game, data);
        this.movement = new AIMovement(this);
        this.stateManager = new StateManager(this);
        //this.controller = new AIController(game, this);
        this.namePlate = new NamePlate(this, this.height / 3 + 1);
    }
    fixedUpdate(dt: number, time: number) {
        super.fixedUpdate(dt, time);
        if (this.isRemote) {
            this.movement?.update(dt, time);
        }
    }
    onDie(data: any): void {
        this.destroy();
    }
}