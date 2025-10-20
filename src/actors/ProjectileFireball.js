import Projectile from "./Projectile";
import { spawnParticles } from "./ParticleEmitter";
import { clamp } from "three/src/math/MathUtils.js";
import HitData from "../core/HitData";

export default class ProjectileFireball extends Projectile {
    constructor(scene, data) {
        data.dur ??= 20000;
        data.name ??= 'fireball';
        super(scene, data);

        this.explode = false;

        this.createMesh();
        this.setGravity(4);
    }

    update(dt) {
        super.update(dt);
        if (this.texture) this.texture.rotation += dt;
        if (this.explode) {
            const sizeDelta = 50 * dt;
            this.scale.add({ x: sizeDelta, y: sizeDelta, z: sizeDelta })
            if (this.scale.x > 8) {
                this.explode = false;
                this.destroy();
            }
        }
    }

    die(data) {
        super.die(data);

        if (this.isRemote) return;
        const explosionRange = this.radius * 20;
        const enemiesInRange = this.scene.actorManager.getActorsInRange(this.owner, this, this.position, explosionRange);
        for (const [enemy, range] of enemiesInRange) {
            const distance = Math.min((1 - ((range - this.radius) / explosionRange)), 1);
            const damage = this.damage * distance;
            const direction = enemy.position.clone().sub(this.position).normalize();
            const force = direction.multiplyScalar(damage * (1 - (range / explosionRange)));
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
    onDie() {
        this.game.soundPlayer.applyPosSound('fireballImpact', this.position);
        spawnParticles(this.position, 55);
        this.active = false;
        this.explode = true;
    }
}