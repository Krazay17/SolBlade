import CPawn from "./CPawn";
import FSM from "../../core/states/FSM";
import PlayerMovement from "./components/PlayerMovement";

export default class CPlayer extends CPawn {
    constructor(game, data) {
        super(game, data);

        this.camera = this.game.camera;
        this.camera.position.set(.333, .666, 1.333);
        this.camera.quaternion.copy(this.quatRot);
        this.graphics.add(this.camera);

        this.controller = this.game.input;
        this.controller.look = (y, p) => this.look(y, p);
        this.movement = new PlayerMovement(game, this);
        this.fsm = new FSM(this.game, this, [
            "run", "fall"
        ]);
    }
    look(yaw, pitch) {
        this.yaw = yaw;
        this.camera.rotation.x = pitch;
    }
    getAim() { }
    
}