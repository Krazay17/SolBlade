import Projectile from "./Projectile";
import { spawnParticles } from "./ParticleEmitter";
import MyEventEmitter from "../core/MyEventEmitter";
import Globals from "../utils/Globals";
import { clamp } from "three/src/math/MathUtils.js";

export default class PFireball extends Projectile {
    constructor(params = {}, net = {}) {
        super(params, net);

        this.exploding = false;
        this.explodeSize = 1;
        this.shrink = true;
        this.flashPower = 0;

        const { texture, material } = this.createMesh();
        this.texture = texture;
        this.material = material;
        this.setGravity(4);
        this.setDamage(25);

        if (!this.isRemote) {
            this.netInit('Fireball');
        }

        PFireball.netFx = PFireball.netFx || false;
        if (!PFireball.netFx) {
            MyEventEmitter.on('netFx', (data) => {
                if (data.type === 'fireballHit') {
                    PFireball.hitFx(this.tempVector.set(data.pos.x, data.pos.y, data.pos.z));
                }
            });
            PFireball.netFx = true;
        }
    }
    static hitFx(pos) {
        spawnParticles(pos, 55);
    }

    update(dt) {
        const scaledDt = dt * 10;
        this.texture.rotation += dt;
        if (this.exploding) {
            if (this.shrink) this.shrink = this.explodeSize <= 0 ? false : true;
            this.explodeSize = this.shrink ? this.explodeSize -= scaledDt : this.explodeSize += scaledDt;
            this.scale.set(this.explodeSize, this.explodeSize, this.explodeSize);
            this.flashPower += dt * 80;
            this.material.emissiveIntensity = (Math.sin(this.flashPower) + 1) / 1.5;
            if (this.explodeSize >= 2) super.destroy();
        } else super.update(dt);
    }

    destroy() {
        //super.destroy();
        this.exploding = true;
        if (this.isRemote) return;
        PFireball.hitFx(this.position);
        MyEventEmitter.emit('fx', { type: 'fireballHit', pos: this.position });

        const explosionRange = 6;
        const enemiesInRange = Globals.scene.getEnemiesInRange(this.position, explosionRange);
        for (const [enemy, range] of enemiesInRange) {
            const distance = clamp((1 - ((range - this.radius) / explosionRange)), .5, 1);
            const damage = this.damage * distance;
            const direction = enemy.position.clone().sub(this.position).normalize();
            const force = direction.multiplyScalar(22 * (1 - (range / explosionRange)));
            enemy.takeDamage(Globals.player, { amount: damage, type: 'explosion' }, { dir: force, dim: 0.3 });
        }
    }
}