import HitData from "../core/HitData";
import { spawnParticles } from './ParticleEmitter';
import ClientProjectile from "./ClientProjectile";
import MyEventEmitter from "../core/MyEventEmitter";

export default class ProjectileFireball extends ClientProjectile {
    constructor(scene, data) {
        super(scene, data);

        this.explode = false;
        console.log(this.damage);

        this.createMesh();
    }

    update(dt) {
        super.update(dt);
        if (this.texture) this.texture.rotation += dt;
        if (this.explode) {
            const sizeDelta = 50 * dt;
            this.graphics.scale.add({ x: sizeDelta, y: sizeDelta, z: sizeDelta })
            if (this.graphics.scale.x > 8) {
                this.explode = false;
                this.destroy();
            }
        }
    }
    onHit(result) {
        const actor = result.actor;
        if (actor) {
            const hitData = new HitData({
                dealer: this.owner,
                target: actor,
                amount: this.damage,
                type: 'fire',
                hitPosition: this.position,
                dim: 500,
            })
            actor.hit(hitData);
        }
    }
    onCollide() {
        this.game.soundPlayer.applyPosSound('fireballImpact', this.position);
        spawnParticles(this.position, 55);
        this.active = false;
        this.explode = true;

        if (this.isRemote) return;
        const explosionRange = this.radius * 20;
        const enemiesInRange = this.game.actorManager.getActorsInRange(this.owner, this, this.position, explosionRange);
        for (const [enemy, range] of enemiesInRange) {
            const distance = Math.min((1 - ((range - this.radius) / explosionRange)), 1);
            const damage = this.damage * distance;
            const direction = enemy.position.clone().sub(this.position).normalize();
            const force = direction.multiplyScalar(Math.min(16, ((damage * .7) * (1 - (range / explosionRange)))));
            const hitData = new HitData({
                dealer: this.owner,
                target: enemy,
                amount: damage,
                impulse: force,
                type: 'fire',
                hitPosition: this.position,
                dim: 500,
            })
            enemy.hit(hitData);
        }

    }
}