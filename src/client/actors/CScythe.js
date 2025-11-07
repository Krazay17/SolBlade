import MyEventEmitter from "../core/MyEventEmitter";
import CProjectile from "./CProjectile";

export default class CScythe extends CProjectile {
    constructor(game, data) {
        super(game, {
            ...data,
            speed: 15,
            gravity: 0,
            radius: data.radius ?? 4,
        });
        this.createMesh("4Scythe");
        this.hitActors = [];
    }
    update(dt, time) {
        super.update(dt, time);
        this.graphics.rotateY(-dt * 10);
    }
    onHit(id) {
        if (!this.isRemote) {
            Object.assign(this.hitData, { target: id, impulse: this.veloctiy, stun: 500 });
            const target = this.game.getActorById(id)
            if (!target) return;
            if(this.hitActors.includes(target))return;
            this.hitActors.push(target);
            target.hit?.(this.hitData);
            MyEventEmitter.emit('actorMulticast', { id: this.id, event: "onHit" })
        }
    }
    onCollide() { };
}