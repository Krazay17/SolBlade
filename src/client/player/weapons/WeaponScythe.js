import HitData from "@solblade/shared/HitData";
import Weapon from "./Weapon";
import ClientProjectile from "../../actors/CProjectile";

export default class WeaponScythe extends Weapon {
    constructor(game, actor, slot) {
        super(game, actor, {
            weapon: 'Scythe',
            damage: 40,
            range: 3,
            cooldown: 1400,
            slot
        });
    }
    use() {
        if (super.use()
            && this.stateManager.setState('attack', { weapon: this, duration: 800 })) {
            this.damageDelay = 400;

            const { pos, rot, dir, camPos } = this.actor.getShootData()
            /**@type {ClientProjectile} */
            const projectile = this.game.actorManager.spawnActor('projectileScythe', {
                pos, rot, dir, owner: this.actor.id,
            }, false);

            this.playAnimation(this.hand, false);
            this.playSound('dash', pos)
        }
    }
    damageTick(dt) {

    }
}