import * as THREE from "three";
import Weapon from "./Weapon";
import CameraFX from "../../core/CameraFX";
import { spawnParticles } from "../../actors/ParticleEmitter";
import HitData from "../../core/HitData";
import { Vector3 } from "three";
import { COLLISION_GROUPS, swingMath, WEAPON_STATS } from "@solblade/shared";

export default class WeaponSword extends Weapon {
    constructor(game, actor, slot = 0) {
        super(game, actor, {
            name: 'Sword',
            damage: WEAPON_STATS.sword.damage,
            range: WEAPON_STATS.sword.range,
            cooldown: WEAPON_STATS.sword.cooldown,
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
                    if (this.weaponTrailDelay) clearTimeout(this.weaponTrailDelay);
                }
            })) {
            this.enemyActors = this.game.hostiles;
            this.hitActors.clear();
            this.hitPauseDiminish = 1;
            this.damageDelay = 550;
            this.damageDuration = 450;
            this.hitPauseDiminish = 1;
            this.dashSpeed = Math.max(11, this.actor.velocity.length());

            this.actor.animationManager.playAnimation('AttackSwordSpell', false);
            this.game.soundPlayer.playPosSound('heavySword', this.actor.position);
            const offset = new Vector3(0, .5, -this.range);
            this.game.fxManager.spawnFX('swordSpell', { actor: this.actor.id, offset, color: 0xff2222 }, true);

            this.weaponTrailDelay = setTimeout(() => {
                this.game.fxManager.spawnFX('attackTrail', { actor: this.actor.id, offset, color: 0xff2222, meshName: "AttackTrail2", scale: 1.5, dur: this.damageDuration }, true);
            }, this.damageDelay);

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
                    if (this.weaponTrailDelay) clearTimeout(this.weaponTrailDelay);
                }
            })) {
            this.enemyActors = this.game.hostiles;
            this.hitActors.clear();
            this.damageDelay = 350;
            this.damageDuration = 250;
            this.hitPauseDiminish = 1;
            this.dashSpeed = Math.max(6, this.actor.velocity.length());

            const anim = this.slot === '0' ? 'AttackSwordLeft' : 'AttackSwordRight';
            this.actor.animationManager.playAnimation(anim, false);
            this.game.soundPlayer.playPosSound('heavySword', this.actor.position);

            this.weaponTrailDelay = setTimeout(() => {
                const offset = new Vector3(0, .5, -this.range);
                this.game.fxManager.spawnFX('attackTrail', { actor: this.actor.id, offset, color: 0xff2222, scale: 1.5, dur: this.damageDuration }, true);
            }, this.damageDelay);
            this.onAttackEnd = () => {
                if (this.afterVelocityY && !this.actor.movement.isGrounded()) {
                    this.actor.velocityY = this.afterVelocityY;
                    this.afterVelocityY = null;
                }
            }

            return true;
        }
    }
    update(dt) {
        super.update(dt);
        const delay = this.lastUsed + this.damageDelay;
        const duration = delay + this.damageDuration;
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
        const { pos, dir } = this.actor.getAim();
        const handPos = this.slot === "0" ? this.actor.leftWeaponBone.getWorldPosition(this.tempVector2) : this.actor.rightWeaponBone.getWorldPosition(this.tempVector2);
        const swingDir = dir.clone().applyAxisAngle(this.upVec, swingMath(this.damageDelta, this.slot === '0'))
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
                        stun: 400,
                        hitPosition: actor.position,
                        impulse: dir.clone().multiplyScalar(8),
                        sound: 'swordHit',
                    }))
                }
                if (this.hitPauseDiminish > .1) {
                    this.actor.animationManager.changeTimeScale(0, 100 * this.hitPauseDiminish);
                    this.hitPauseDiminish -= .2;
                    //this.modifiedDuration = this.damageDuration + 100 * this.hitPauseDiminish;
                }
                CameraFX.shake(0.14, 150);

                this.pendingVelocityY = Math.max(this.actor.velocityY, 1);
                this.afterVelocityY = Math.max(this.actor.velocityY, 4);
            }
        }
        this.cubeTrace(handPos, swingDir, .1, this.range, collide);

        //apply velocity from outside of the damage callback, because rapier idk
        if (this.pendingVelocityY) {
            this.actor.velocityY = this.pendingVelocityY;
            this.pendingVelocityY = null;
        }
    }
    spellDamage() {
        if (!this.actor.parry) {
            this.actor.setParry(true);
        }
        const { pos, dir } = this.actor.getAim();
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
                        stun: 400,
                        hitPosition: actor.position,
                        impulse: dir.clone().multiplyScalar(8),
                        sound: 'swordHit',
                    }))
                }
                if (this.hitPauseDiminish > .1) {
                    this.actor.animationManager.changeTimeScale(0, 100 * this.hitPauseDiminish);
                    this.hitPauseDiminish -= .2;
                    //this.modifiedDuration = this.damageDuration + 100 * this.hitPauseDiminish;
                }
                CameraFX.shake(0.14, 150);
            }
        }

        const rightVec = dir.clone().cross(this.downVec)
        const swingRot = dir.clone().applyAxisAngle(rightVec, Math.PI / 3 * swingMath(this.damageDelta, false));

        this.cubeTrace(pos, swingRot, .4, this.range, collide);
    }
}
