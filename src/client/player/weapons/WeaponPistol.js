import Weapon from './Weapon.js';
import MeshTrace from '../../core/MeshTrace.js';
import HitData from '../../core/HitData.js';
import RAPIER from '@dimforge/rapier3d-compat';

export default class WeaponPistol extends Weapon {
    constructor(game, actor, slot = '0') {
        super(game, actor, {
            weapon: 'Pistol',
            damage: 20,
            range: 50,
            cooldown: 800,
            slot
        });
        this.meshTracer = new MeshTrace(this.game, this.actor);
    }
    use() {
        if (super.use() &&
            this.actor.stateManager.setState('attack', {
                weapon: this, anim: 'gunShoot', duration: 350
            })) {
            const { dir, pos, camPos } = this.actor.getShootData();
            this.hitActors.clear();
            this.game.soundPlayer.playPosSound('pistolShoot', pos);
            this.playAnimation(this.hand, false, undefined);

            this.meshTracer.shapeTrace(camPos, dir, this.range, 0.1, (/**@type {RAPIER.ColliderShapeCastHit}*/r) => {
                if (r) {
                    this.game.fxManager.spawnFX(undefined, { pos: r.witness1 });
                    const target = r.collider.actor;
                    if (!target) return;
                    target.hit(new HitData({
                        dealer: this.actor,
                        target,
                        impulse: dir.multiplyScalar(2),
                        amount: 15,
                        stun: 50,
                        dim: 500,
                    }))
                }
            })
            return true;
        }
        return false;
    }
}