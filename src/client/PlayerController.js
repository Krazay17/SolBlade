import CPlayer from "./actors/CPlayer";
import CGame from "./CGame";
import Input from "./Input";
import { Actions } from "./other/Actions";

export default class PlayerController {
    /**
     * 
     * @param {CGame} game 
     * @param {CPlayer} player
     * @param {Input} input 
     */
    constructor(game, player, input) {
        this.game = game;
        this.player = player;
        this.input = input;

        this.yaw = 0;
        this.pitch = 0;
    }
    update(dt) {
        const action = this.input.actionStates;
        const yaw = this.input.yaw;
        const pitch = this.input.pitch;
        const iDir = this.inputDirection(action);
        if (iDir) this.player.move(iDir);
        if (this.yaw !== yaw || this.pitch !== pitch) this.player.look(yaw, pitch);
    }
    inputDirection(action) {
        let x = 0, z = 0;
        if (action[Actions['FWD']]) z += 1;
        if (action[Actions['BWD']]) z -= 1;
        if (action[Actions['LEFT']]) x += 1;
        if (action[Actions['RIGHT']]) x -= 1;

        if (x === 0 && z === 0) {
            return false;
        } else {
            return { x, z };
        }
    }
}