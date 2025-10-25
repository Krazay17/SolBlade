import Weapon from "./Weapon";
import CameraFX from "../../core/CameraFX";
import { spawnParticles } from "../../actors/ParticleEmitter";
import HitData from "../../core/HitData";

export default class WeaponSword extends Weapon {
    constructor(actor, game, isSpell = false) {
        super(actor, 'Sword', 35, 2.9, 1200, isSpell); // name, damage, range, cooldown
        this.game = game;
        this.traceDuration = 500; // duration of the sword trace in milliseconds
    }
    spellUse() {
        if (super.spellUse() &&
            this.actor.stateManager.setState('attack', {
                duration: 1200,
                anim: 'spinSlash',
                damageDelay: 415,
                damageDuration: 450,
                weapon: this,
                doesParry: true
            })) {
            this.enemyActors = this.game.hostiles;
            this.hitActors.clear();

            this.game.soundPlayer.playPosSound('heavySword', this.actor.position);
            return true;
        } else {
            return false;
        }
    }
    hitFx(pos) {
        spawnParticles(pos, 25);
    }
    use() {
        if (super.use() &&
            this.actor.stateManager.setState('attack', {
                weapon: this,
                anim: 'attackRight',
                damageDelay: 240,
                damageDuration: 220,
                duration: 600,
                doesParry: true,
                friction: 2,
                speed: 2,
            })) {
            this.enemyActors = this.game.actorManager.hostiles;
            this.hitActors.clear();

            this.game.soundPlayer.playPosSound('heavySword', this.actor.position);
        }
    }
    update() {
        this.meleeTrace(this.actor.position, this.actor.getCameraDirection(), this.range, 0.5, (target, camDir) => {
            const knockbackDir = this.tempVector2.copy(camDir).normalize().multiplyScalar(8);
            target.hit?.(new HitData({
                dealer: this.actor,
                target,
                type: 'physical',
                amount: this.damage,
                stun: 500,
                hitPosition: target.position,
                impulse: knockbackDir,
                sound: 'swordHit',
            }));

            this.actor.animationManager.changeTimeScale(0, 150);
            CameraFX.shake(0.14, 150);
        });
        if (this.isSpell) {
            this.actor.movement.dashForward();
        }
    }
}
