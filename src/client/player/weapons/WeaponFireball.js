import { WEAPON_STATS } from '@solblade/shared';
import Weapon from './Weapon';

export default class WeaponFireball extends Weapon {
    constructor(game, actor, slot = 0) {
        super(game, actor, {
            name: 'Fireball',
            damage: WEAPON_STATS.fireball.damage,
            range: WEAPON_STATS.fireball.range,
            cooldown: WEAPON_STATS.fireball.cooldown,
            slot,
            meshName: "FireballWeapon",
        });
    }
    spellUse() {
        if (super.spellUse() &&
            this.actor.stateManager.setState('attack', {
                weapon: this,
                duration: 1300,
                anim: 'attackSpell',
                onExit: () => { if (this.onAttack) clearTimeout(this.onAttack) }
            })) {
            this.onAttack = setTimeout(() => this.shootFireball(1, 30, this.damage * 2), 800);
            this.actor.animationManager.playAnimation('attackSpell', false);
            this.game.soundPlayer.playPosSound('fireWhoosh', this.actor.position);
            return true;
        }
    }
    update(dt) {
        if (this.slot > 1) {
            this.movement.hoverFreeze(dt);
        } else {
            this.movement.smartMove(dt);
        }
    }
    use() {
        if (super.use()
            && this.stateManager.setState('attack', {
                weapon: this, duration: 550, onExit: () => { if (this.onAttack) clearTimeout(this.onAttack) }
            })
        ) {
            this.onAttack = setTimeout(() => this.shootFireball(.35, 70, this.damage), 200);
            const anim = this.slot === '0' ? 'attackLeft' : 'attackRight';
            this.actor.animationManager.playAnimation(anim, false);
            this.game.soundPlayer.playPosSound('fireballUse', this.actor.position);
            return true;
        }
    }

    shootFireball(radius = 1, speed = 35, damage = 10) {
        const { pos, dir } = this.actor.getAim();
        const projectile = this.game.actorManager.spawnActor('fireball', {
            pos,
            dir,
            radius,
            damage,
            speed,
            gravity: 7,
            liftetime: 30000,
            owner: this.actor.id,
        }, false, true);
    }
}