import Projectile from "./Projectile";
import { spawnParticles } from "./ParticleEmitter";
import MyEventEmitter from "../core/MyEventEmitter";

/**
 * @param {number} dur in ms
 */
export default class PFireball extends Projectile {
    constructor(params = {}, net = {}) {
        super(params, net);

        this.createMesh();
        this.setGravity(6);
        this.setDamage(40);

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

    destroy() {
        super.destroy();
        if (this.isRemote) return;
        MyEventEmitter.emit('fx', { type: 'fireballHit', pos: this.position });
    }
}