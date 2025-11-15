import Weapon from './Weapon.js';
import MeshTrace from '../../core/MeshTrace.js';
import HitData from '../../core/HitData.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { WEAPON_STATS } from '@solblade/shared';

export default class WeaponPistol extends Weapon {
    constructor(game, actor, slot = '0') {
        super(game, actor, {
            name: 'Pistol',
            damage: WEAPON_STATS.pistol.damage,
            range: WEAPON_STATS.pistol.range,
            cooldown: WEAPON_STATS.pistol.cooldown,
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

            const anim = this.slot === "0" ? "AttackPistolLeft" : "AttackPistolRight";
            this.shoot(this.damage, anim);
            return true;
        }
        return false;
    }
    shoot(damage, anim) {
        const { dir, pos } = this.actor.getAim();
        this.hitActors.clear();
        this.game.soundPlayer.playPosSound('SpaceGun', pos);
        this.playAnimation(anim, false, true);
        const impulse = dir.clone().multiplyScalar(-2);
        this.actor.body.applyImpulse({ x: impulse.x, y: impulse.y, z: impulse.z }, true)

        this.didHit = false
        this.meshTracer.shapeTrace(pos, dir, this.range, 0.05, (/**@type {RAPIER.ColliderShapeCastHit}*/r) => {
            if (r) {
                this.didHit = true;
                this.game.fxManager.spawnFX("line", { pos: r.witness1, dir: dir.clone().multiplyScalar(-1), length: r.time_of_impact }, true);
                this.game.fxManager.spawnFX("explosion", { pos: r.witness1, color: 0xff0000 }, true);
                const actor = this.game.getActorById(r.collider.actor)
                if (!actor) return;
                actor.hit(new HitData({
                    dealer: this.actor,
                    target: actor,
                    impulse: dir.multiplyScalar(4),
                    amount: damage,
                    dim: 500,
                }))
            }
        });
        if (!this.didHit) {
            this.game.fxManager.spawnFX("line", { pos: pos.addScaledVector(dir, this.range), dir: dir.clone().multiplyScalar(-1), length: this.range }, true);
        }
    }
    spellUse() {
        if (super.spellUse() &&
            this.stateManager.setState('attack', {
                weapon: this,
                duration: 1000,
                onExit: () => {
                    if (this.spellActionLoop) clearTimeout(this.spellActionLoop);
                }
            })) {
            this.shoot(this.damage / 2, "AttackPistolRight");
            this.animIndex = 0;
            this.spellActionLoop = setInterval(() => {
                this.animIndex++;
                let anim = this.animIndex % 2 ? "AttackPistolLeft" : "AttackPistolRight";
                this.shoot(this.damage / 2.5, anim);
            }, 200);
        }
    }
}