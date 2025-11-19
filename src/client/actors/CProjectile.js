import { Projectile } from "@solblade/shared";
import { Mesh, MeshBasicMaterial, Object3D, SphereGeometry, Vector3, Quaternion } from "three";
import Game from "../CGame";
import HitData from "../core/HitData";
import MyEventEmitter from "../core/MyEventEmitter";

export default class CProjectile extends Projectile {
    constructor(game, data) {
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

        super(game.physicsWorld, { ...data, pos, dir, rot });
        /**@type {Game} */
        this.game = game;

        this.graphics = new Object3D();
        this.graphics.position.copy(this.pos);
        this.graphics.quaternion.copy(this.rot);
        this.game.add(this.graphics);

        this.ignoreCol = this.game.player.collider;

        this.hitData = new HitData({
            dealer: this.owner,
            amount: this.damage,
            critMult: 2
        })
    }
    get position() { return this.pos };
    get actorManager() { return this.game.actorManager };
    setId(id) {
        this.id = id;
    }
    update(dt, time) {
        this.graphics.position.lerp(this.pos, dt * 60);
    }
    destroy() {
        this.game.actorManager.removeActor(this);
        this.game.remove(this.graphics);
        super.destroy();
    }
    async createMesh(meshName) {
        let mesh;
        if (meshName) {
            mesh = await this.game.meshManager.getMesh(meshName)
        } else {
            mesh = new Mesh(
                new SphereGeometry(this.radius),
                new MeshBasicMaterial({ color: 'white' })
            );
        }
        this.graphics.add(mesh);
        return mesh;
    }
    onCollide() {
        if(this.noCollide)return;
        super.onCollide()
        if (!this.isRemote) {
            MyEventEmitter.emit('actorMulticast', { id: this.id, event: "onCollide" })
        }
    }
}