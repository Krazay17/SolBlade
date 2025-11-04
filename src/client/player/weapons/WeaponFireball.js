import Weapon from './Weapon';

export default class WeaponFireball extends Weapon {
    constructor(game, actor, slot = 0) {
        super(game, actor, {
            name: 'Fireball',
            damage: 30,
            range: 100,
            cooldown: 1250,
            slot
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
            this.onAttack = setTimeout(() => this.shootFireball(1, 35, 30), 800);
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
            this.onAttack = setTimeout(() => this.shootFireball(.4, 100, 15), 200);
            const anim = this.slot === '0' ? 'attackLeft' : 'attackRight';
            this.actor.animationManager.playAnimation(anim, false);
            this.game.soundPlayer.playPosSound('fireballUse', this.actor.position);
            return true;
        }
    }

    shootFireball(radius = 1, speed = 35, damage = 10) {
        const { pos, dir } = this.actor.getShootData()
        const projectile = this.game.actorManager.spawnActor('fireball', {
            pos,
            dir,
            radius,
            damage,
            speed,
            liftetime: 30000,
            owner: this.actor.id,
        }, false, true);
    }
}