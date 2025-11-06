import CProjectile from "./CProjectile";

export default class CScythe extends CProjectile {
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