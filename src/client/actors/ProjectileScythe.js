import ClientProjectile from "./ClientProjectile";

export default class ProjectileScythe extends ClientProjectile {
    constructor(game, data) {
        super(game, {
            ...data,
            speed: 15,
            gravity: 0,
        });
        this.createMesh("4Scythe");
    }
    update(dt, time) {
        super.update(dt, time);
        this.graphics.rotateY(-dt*10);
    }
}