import Weapon from "./Weapon";
import ClientProjectile from "../../actors/CProjectile";
import { WEAPON_STATS } from "@solblade/shared";

export default class WeaponScythe extends Weapon {
    constructor(game, actor, slot) {
        super(game, actor, {
            name: 'Scythe',
            damage: WEAPON_STATS.scythe.damage,
            range: WEAPON_STATS.scythe.range,
            cooldown: WEAPON_STATS.scythe.cooldown,
            meshName: "ScytheWeapon",
            slot
        });
    }
    use() {
        if (super.use()
            && this.stateManager.setState('attack', {
                weapon: this, duration: 800, onExit: () => {
                    clearTimeout(this.onAttack);
                }
            })) {
            this.damageDelay = 350;

            this.onAttack = setTimeout(() => {
                const { pos, dir, rot } = this.actor.getAim()
                /**@type {ClientProjectile} */
                const projectile = this.game.actorManager.spawnActor('scythe', {
                    pos,
                    rot,
                    dir,
                    owner: this.actor.id,
                    damage: this.damage,
                }, false, true);
            }, this.damageDelay);

            const anim = this.slot === '0' ? "AttackSwordLeft" : "AttackSwordRight";
            this.playAnimation(anim, false);
            this.playSound('heavySword', this.actor.pos);
        }
    }
    damageTick(dt) {

    }
}