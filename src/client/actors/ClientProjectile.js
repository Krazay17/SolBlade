import { Projectile } from "@solblade/shared";
import { Mesh, MeshBasicMaterial, Object3D, SphereGeometry } from "three";
import Game from "../Game";

export default class ClientProjectile extends Projectile {
    constructor(game, data) {
        super(game.physicsWorld, data);
        /**@type {Game} */
        this.game = game;
        this.graphics = new Object3D();
        this.graphics.position.copy(this.pos);
        this.graphics.quaternion.copy(this.rot);
        this.game.add(this.graphics);
    }
    async createMesh(meshName) {
        let mesh;
        if (meshName) {
            await this.game.meshManager.getMesh(meshName).then((m) => {
                mesh = m;
            })
        } else {
            mesh = new Mesh(
                new SphereGeometry(.5),
                new MeshBasicMaterial({ color: 'white' })
            );
        }
        this.graphics.add(mesh);
    }
    update(dt, time) {
        this.graphics.position.lerp(this.pos, dt * 60);
    }
}