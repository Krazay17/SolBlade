import Weapon from './Weapon.js';
import MeshTrace from '../../core/MeshTrace.js';
import HitData from '../../core/HitData.js';
import RAPIER from '@dimforge/rapier3d-compat';

export default class WeaponPistol extends Weapon {
    constructor(game, actor, slot = '0') {
        super(game, actor, {
            name: 'Pistol',
            damage: 20,
            range: 50,
            cooldown: 800,
            meshName: "PistolWeapon",
            slot
        });
        this.meshTracer = new MeshTrace(this.game, this.actor);
    }
    use() {
        if (super.use() &&
            this.actor.stateManager.setState('attack', {
                weapon: this,
                duration: 550
            })) {
            const { dir, pos } = this.actor.getAim();
            this.hitActors.clear();
            this.game.soundPlayer.playPosSound('SpaceGun', pos);
            const anim = this.slot === "0" ? "AttackPistolLeft" : "AttackPistolRight";
            this.playAnimation(anim, false);
            const impulse = dir.clone().multiplyScalar(-4);
            this.actor.body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true)

            this.didHit = false
            this.meshTracer.shapeTrace(pos, dir, this.range, 0.05, (/**@type {RAPIER.ColliderShapeCastHit}*/r) => {
                if (r) {
                    this.didHit = true;
                    this.game.fxManager.spawnFX("line", { pos: r.witness1, dir: dir.clone().multiplyScalar(-1), length: r.time_of_impact }, true);
                    this.game.fxManager.spawnFX("explosion", { pos: r.witness1 }, true);
                    const actor = this.game.getActorById(r.collider.actor)
                    if (!actor) return;
                    actor.hit(new HitData({
                        dealer: this.actor,
                        target: actor,
                        impulse: dir.multiplyScalar(2),
                        amount: 22,
                        stun: 50,
                        dim: 500,
                    }))
                }
            });
            if (!this.didHit) {
                this.game.fxManager.spawnFX("line", { pos: pos.addScaledVector(dir, this.range), dir: dir.clone().multiplyScalar(-1), length: this.range }, true);
            }

            return true;
        }
        return false;
    }
}