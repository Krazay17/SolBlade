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
        meshName: string,
        radius: number = .5,
        height: number = 1,
    ) {
        super(game, data, meshName, radius, height);
        this.movement = new AIMovement(this);
        this.stateManager = new StateManager(this);
        this.controller = new AIController(game, this);
        this.namePlate = new NamePlate(this, this.height/3 + 2);
    }
}