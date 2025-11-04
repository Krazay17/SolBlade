import { Actor } from "@solblade/shared";
import { Mesh, MeshBasicMaterial, Object3D, SphereGeometry, Vector3, Quaternion } from "three";
import Game from "../CGame";
import MyEventEmitter from "../core/MyEventEmitter";

export default class ClientActor extends Actor {
    constructor(game, data = {}) {
        const posArr = data.pos;
        const dirArr = data.dir;
        const rotArr = data.rot;

        const pos = Array.isArray(posArr)
            ? new Vector3(posArr[0] || 0, posArr[1] || 0, posArr[2] || 0)
            : new Vector3(posArr?.x || 0, posArr?.y || 0, posArr?.z || 0);

        const dir = Array.isArray(dirArr)
            ? new Vector3(dirArr[0] || 0, dirArr[1] || 0, dirArr[2] || 0)
            : new Vector3(dirArr?.x || 0, dirArr?.y || 0, dirArr?.z || 0);

        const rot = Array.isArray(rotArr)
            ? new Quaternion(rotArr[0] || 0, rotArr[1] || 0, rotArr[2] || 0, rotArr[3] || 1)
            : new Quaternion(rotArr?.x || 0, rotArr?.y || 0, rotArr?.z || 0, rotArr?.w || 1);
            
        super({ ...data, pos, dir, rot });
        /**@type {Game} */
        this.game = game;
        this.destroyed = false;
        this.isRemote = data.isRemote ?? false;

        this.graphics = new Object3D();
        this.graphics.position.copy(this.pos);
        this.graphics.quaternion.copy(this.rot);
        this.game.add(this.graphics);

        this.body = null;
        this.collider = null;

        if (!this.isRemote) {
            this.lastSentPos = this.pos;
        }

        this.init();
    }
    get position() { return this.pos };
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
    activate(data) {
        this.graphics.position.copy(this.pos);
        this.graphics.quaternion.copy(this.rot);
        this.game.add(this.graphics);
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
        if (!this.active) return;
        MyEventEmitter.emit('actorEvent', { id: this.id, event: "hit", data: data.serialize() });
        this.game.soundPlayer.playSound('hit');
    }
    applyHit(data) {
        this.deActivate();
    }
}