import Weapon from "./Weapon";
import CameraFX from "../../core/CameraFX";
import { spawnParticles } from "../../actors/ParticleEmitter";
import HitData from "../../core/HitData";
import { Vector3 } from "three";
import { swingMath, WEAPON_STATS } from "@solblade/shared";

export default class WeaponBlade extends Weapon {
    constructor(game, actor, slot = 0) {
        super(game, actor, {
            name: 'Blade',
            damage: WEAPON_STATS.claw.damage,
            range: WEAPON_STATS.claw.range,
            cooldown: WEAPON_STATS.claw.cooldown,
            meshName: "BladeWeapon",
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
            this.game.fxManager.spawnFX("tornado", { actor: this.actor.id, color: 0x22ff22 });

            return true;
        }
    }
    use() {
        if (super.use() &&
            this.stateManager.setState('attack', {
                weapon: this,
                duration: 500,
                onExit: () => {
                    this.actor.setParry(false);
                    if (this.weaponTrailDelay) clearTimeout(this.weaponTrailDelay)
                    if (this.fx) this.fx.destroy();
                }
            })) {
            this.enemyActors = this.game.hostiles;
            this.hitActors.clear();
            this.damageDelay = 250;
            this.damageDuration = 150;
            this.hitPauseDiminish = 1;
            this.dashSpeed = Math.max(6, this.actor.velocity.length());

            const anim = this.slot === '0' ? 'attackLeft' : 'attackRight';
            this.actor.animationManager.playAnimation(anim, false);
            this.game.soundPlayer.playPosSound('heavySword', this.actor.position);

            this.weaponTrailDelay = setTimeout(() => {
                const offset = new Vector3(0, .3, -this.range);
                this.fx = this.game.fxManager.spawnFX('attackTrail', { actor: this.actor.id, offset, color: 0x22ff22, dur: this.damageDuration }, true);
            }, this.damageDelay);

            return true;
        }
    }
    update(dt) {
        super.update(dt);
        const delay = this.lastUsed + this.damageDelay;
        const duration = delay + this.damageDuration;
        // if (delay < performance.now() && (duration > performance.now())) {
        //     this.meleeTrace(this.actor.position, this.actor.getCameraDirection(), this.range, 0.5, (target, camDir) => {
        //         const knockbackDir = this.tempVector2.copy(camDir).normalize().multiplyScalar(4);
        //         target.hit?.(new HitData({
        //             dealer: this.actor,
        //             target,
        //             type: 'physical',
        //             amount: this.damage,
        //             stun: 400,
        //             hitPosition: target.position,
        //             impulse: knockbackDir,
        //             sound: 'swordHit',
        //         }));

        //         if (this.hitPauseDiminish > .1) {
        //             this.actor.animationManager.changeTimeScale(0.1, 100 * this.hitPauseDiminish);
        //             this.hitPauseDiminish -= .2;
        //         }
        //         CameraFX.shake(0.14, 150);
        //         const prevY = this.actor.velocityY;
        //         this.actor.velocityY = Math.max(prevY, 4);
        //     });
        //     if (!this.actor.parry) {
        //         this.actor.setParry(true);
        //     }
        // }
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
    damageTick(dt) {
        if (this.slot < 2) this.normalDamage();
        else this.spellDamage();
    }
    normalDamage() {
        if (!this.actor.parry) {
            this.actor.setParry(true);
        }
        const collide = (c) => {
            const target = c.actor;
            if (target && !this.hitActors.has(target)) {
                this.hitActors.add(target);
                const actor = this.game.getActorById(target);
                if (actor) {
                    actor.hit(new HitData({
                        dealer: this.actor.id,
                        target,
                        type: 'physical',
                        amount: this.damage,
                        stun: 100,
                        hitPosition: actor.position,
                        impulse: dir.clone().multiplyScalar(4),
                        sound: 'swordHit',
                    }))
                }
                if (this.hitPauseDiminish > .1) {
                    this.actor.animationManager.changeTimeScale(0.1, 100 * this.hitPauseDiminish);
                    this.hitPauseDiminish -= .2;
                }
                CameraFX.shake(0.14, 150);

                this.pendingVelocityY = Math.max(this.actor.velocityY, 4);
            }
        }
        const { pos, dir } = this.actor.getAim();
        const handPos = this.slot === "0" ? this.actor.leftWeaponBone.getWorldPosition(this.tempVector2) : this.actor.rightWeaponBone.getWorldPosition(this.tempVector2);
        const swingDir = dir.clone().applyAxisAngle(this.upVec, swingMath(this.damageDelta, this.slot === '0'))

        this.cubeTrace(handPos, swingDir, .1, this.range, collide);
        if (this.pendingVelocityY) {
            this.actor.velocityY = this.pendingVelocityY;
            this.pendingVelocityY = null;
        }
    }
    spellDamage() {
        const pos = this.actor.pos;
        this.ballTrace(pos, 1.5, (c) => {
            const id = c.actor;
            const actor = this.game.getActorById(id);
            if (actor && !this.hitActors.has(id)) {
                this.hitActors.add(id);
                const impulse = actor.pos.clone().sub(this.actor.pos).normalize().multiplyScalar(6);
                actor.hit(new HitData({
                    dealer: this.actor.id,
                    target: actor,
                    type: 'physical',
                    amount: this.damage,
                    stun: 100,
                    impulse,
                    hitPosition: this.actor.position,
                    sound: 'swordHit',
                }))
            }
        })
    }
}