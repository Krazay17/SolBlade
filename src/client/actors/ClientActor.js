import { Actor } from "@solblade/shared";
import { Mesh, MeshBasicMaterial, Object3D, SphereGeometry } from "three";
import Game from "../Game";
import MyEventEmitter from "../core/MyEventEmitter";

export default class ClientActor extends Actor {
    constructor(game, data) {
        super(data);
        /**@type {Game} */
        this.game = game;

        this.graphics = new Object3D();
        this.graphics.position.copy(this.pos);
        this.graphics.quaternion.copy(this.rot);
        this.game.add(this.graphics);

        this.body = null;
        this.collider = null;

        this.init();
    }
    async createMesh(meshName, color = "white") {
        let mesh;
        if (meshName) {
            mesh = await this.game.meshManager.getMesh(meshName)
        } else {
            mesh = new Mesh(
                new SphereGeometry(.5),
                new MeshBasicMaterial({ color })
            );
        }
        if (!mesh) return;
        this.graphics.add(mesh);
    }
    deActivate() {
        if (!this.active) return;
        this.game.actorManager.removeActor(this);
        this.game.remove(this.graphics);

        super.deActivate();
    }
    destroy() {
        if (this.destroyed) return;
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
    hit(data) {
        MyEventEmitter.emit('actorEvent', { id: this.netId, event: "hit", data: data.serialize() });
        this.game.soundPlayer.playSound('hit');
    }
    applyHit(data) {
        this.deActivate();
    }
}