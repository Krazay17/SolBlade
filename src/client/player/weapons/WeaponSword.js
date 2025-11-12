import Weapon from "./Weapon";
import CameraFX from "../../core/CameraFX";
import { spawnParticles } from "../../actors/ParticleEmitter";
import HitData from "../../core/HitData";
import { Vector3 } from "three";

export default class WeaponSword extends Weapon {
    constructor(game, actor, slot = 0) {
        super(game, actor, {
            name: 'Sword',
            damage: 40,
            range: 4,
            cooldown: 1500,
            meshName: "GreatSword",
            slot
        });

        this.damageDuration = 0; // duration of the sword trace in milliseconds
        this.dashSpeed = 0;
    }
    hitFx(pos) {
        spawnParticles(pos, 25);
    }
    spellUse() {
        if (super.spellUse() &&
            this.actor.stateManager.setState('attack', {
                // pass attack state this, so it can tick this for damage
                weapon: this,
                duration: 1300,
                onExit: () => {
                    this.actor.setParry(false);
                }
            })) {
            this.enemyActors = this.game.hostiles;
            this.hitActors.clear();
            this.hitPauseDiminish = 1;
            this.damageDelay = 415;
            this.damageDuration = 450;
            this.hitPauseDiminish = 1;
            this.dashSpeed = Math.max(11, this.actor.velocity.length());

            this.actor.animationManager.playAnimation('spinSlash', false);
            this.game.soundPlayer.playPosSound('heavySword', this.actor.position);

            return true;
        }
    }
    use() {
        if (super.use() &&
            this.stateManager.setState('attack', {
                weapon: this,
                duration: 900,
                onExit: () => {
                    this.actor.setParry(false);
                    if(this.weaponTrailDelay) clearTimeout(this.weaponTrailDelay);
                }
            })) {
            this.enemyActors = this.game.hostiles;
            this.hitActors.clear();
            this.damageDelay = 400;
            this.damageDuration = 250;
            this.hitPauseDiminish = 1;
            this.dashSpeed = Math.max(6, this.actor.velocity.length());

            const anim = this.slot === '0' ? 'AttackSwordLeft' : 'AttackSwordRight';
            this.actor.animationManager.playAnimation(anim, false);
            this.game.soundPlayer.playPosSound('heavySword', this.actor.position);

            this.weaponTrailDelay = setTimeout(() => {
                const offset = new Vector3(0, 0, -this.range / 2);
                this.game.fxManager.spawnFX('attackTrail', { actor: this.actor.id, offset, color: 0xff2222 }, true);
            }, this.damageDelay);

            return true;
        }
    }
    update(dt) {
        const delay = this.lastUsed + this.damageDelay;
        const duration = delay + this.damageDuration;
        if (delay < performance.now() && (duration > performance.now())) {
            this.meleeTrace(this.actor.position, this.actor.getCameraDirection(), this.range, 0.5, (target, camDir) => {
                const knockbackDir = this.tempVector2.copy(camDir).normalize().multiplyScalar(8);
                target.hit?.(new HitData({
                    dealer: this.actor,
                    target,
                    type: 'physical',
                    amount: this.damage,
                    stun: 400,
                    hitPosition: target.position,
                    impulse: knockbackDir,
                    sound: 'swordHit',
                }));

                if (this.hitPauseDiminish > .1) {
                    this.actor.animationManager.changeTimeScale(0.1, 100 * this.hitPauseDiminish);
                    this.hitPauseDiminish -= .2;
                }
                CameraFX.shake(0.14, 150);
                const prevY = this.actor.velocityY;
                this.actor.velocityY = Math.max(prevY, 4);
            });
            if (!this.actor.parry) {
                this.actor.setParry(true);
            }
        }
        if (this.slot > 1) {
            if (delay < performance.now() && duration > performance.now()) {
                this.dashSpeed = Math.max(0, this.dashSpeed - 6 * dt);
                this.actor.movement.dashForward(this.dashSpeed);
            }
            this.movement.hoverFreeze(dt, .95);
        } else {
            if (duration > performance.now()) {
                this.dashSpeed = Math.max(0, this.dashSpeed - 6 * dt);
                if (this.movement.isGrounded()) {
                    this.actor.movement.dashForward(this.dashSpeed, true, true);
                }
            }
            this.movement.smartMove(dt);
        }
    }
}
