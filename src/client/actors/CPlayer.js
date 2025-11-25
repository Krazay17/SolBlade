import CPawn from "./CPawn";
import GameClient from "../core/GameClient";
import PlayerMovement from "./components/PlayerMovement";
import FSM from "@solblade/common/actors/states/FSM";

export default class CPlayer extends CPawn {
    /**
     * 
     * @param {GameClient} game 
     * @param {*} data 
     */
    constructor(game, data) {
        super(game, {
            ...data,
            name: "player",
            type: 'player',
            isLocal: true,
        });
        this.camera = this.game.camera;
        this.camera.position.set(.333, .666, 1.333);
        this.camera.quaternion.copy(this.quatRot);
        this.graphics.add(this.camera);

        this.controller = this.game.input;
        this.controller.look = (y, p) => this.look(y, p);
        //this.movement = new PlayerMovement(game, this);
        this.fsm = new FSM(this, [
            "run", "fall"
        ]);
    }
    init(){
        this.game.graphics.add(this.graphics);
        console.log('player init');
    }
    look(yaw, pitch) {
        this.yaw = yaw;
        this.camera.rotation.x = pitch;
    }
    getAim() { 
        const dir = null
        return {dir};
    }

}