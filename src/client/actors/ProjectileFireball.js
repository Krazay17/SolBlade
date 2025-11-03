import HitData from "../core/HitData";
import { spawnParticles } from './ParticleEmitter';
import ClientProjectile from "./ClientProjectile";

export default class ProjectileFireball extends ClientProjectile {
    constructor(scene, data) {
        super(scene, data);

        this.explode = false;

        this.createMesh();
        this.onCollide = ()=>this.collide()
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

    collide() {
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
            enemy.hit(new HitData({
                dealer: this.owner,
                target: enemy,
                amount: damage,
                impulse: force,
                type: 'fire',
                hitPosition: this.position,
                dim: 500,
            }));
        }

    }
}