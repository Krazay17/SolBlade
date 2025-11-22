import CPawn from "./CPawn";
import FSM from "../../core/states/FSM";
import PlayerController from "../PlayerController";

export default class CPlayer extends CPawn {
    constructor(game, data) {
        super(game, data);

        this.fsm = new FSM(this.game, this, [
            "run"
        ]);
        this.camera = this.game.camera
        this.camera.position.set(.333, .666, 1.333);
        this.camera.quaternion.copy(this.quatRot);
        this.graphics.add(this.camera);

        this.controller = new PlayerController(this.game, this, this.game.input);
    }
    move(dir){
        
    }
    look(yaw, pitch) {
        this.yaw = yaw;
        this.camera.rotation.x = pitch;
    }
}