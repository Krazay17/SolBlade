import Weapon from "./Weapon";

export default class WeaponScythe extends Weapon {
    constructor(game, slot) {
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
            && this.stateManager.setState('attack', {weapon: this, duration: 800})) {
            this.damageDelay = 400;
        }
    }
    damageTick(dt) {
        
    }
}