import { Actor } from "@solblade/shared";
import { Object3D, Quaternion, Vector3 } from "three";
import Game from "../Game";

export default class ClientActor extends Actor {
    constructor(game, data) {
        super(data);
        /**@type {Game} */
        this.game = game;

        this.graphics = new Object3D();
        this.graphics.position.copy(this.pos);
        this.graphics.quaternion.copy(this.rot);
        this.game.add(this.graphics);
    }
    destroy() {
        this.game.actorManager.removeActor(this);
        this.game.remove(this.graphics);
        super.destroy()
    }
    add(obj) {
        this.graphics.add(obj)
    }
    remove(obj) {
        this.graphics.remove(obj)
    }
}