import Weapon from "./Weapon";
import CameraFX from "../../core/CameraFX";
import * as THREE from "three";
import MyEventEmitter from "../../core/MyEventEmitter";
import Globals from "../../utils/Globals";
import { spawnParticles } from "../../actors/ParticleEmitter";
import HitData from "../../core/HitData";

export default class WeaponSword extends Weapon {
    constructor(actor, game, isSpell = false) {
        super(actor, 'Sword', 35, 2.9, 1200, isSpell); // name, damage, range, cooldown
        this.game = game;
        this.traceDuration = 500; // duration of the sword trace in milliseconds

        this.debugMesh = null;
        if (Globals.DEBUG) {
            const geometry = new THREE.BoxGeometry(this.range, 1, 0.5);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
            this.debugMesh = new THREE.Mesh(geometry, material);
            this.debugMesh.visible = false;
            Globals.graphicsWorld.add(this.debugMesh);
        }
    }
    spellUse(currentTime) {
        if (this.canSpellUse(currentTime)
            && this.actor.stateManager.setState('attack', {
                duration: 1200,
                anim: 'spinSlash',
                damageDelay: 415,
                damageDuration: 450,
                weapon: this,
                doesParry: true
            })) {
            this.lastUsed = currentTime;
            this.enemyActors = this.game.hostiles;
            this.hitActors.clear();
            return true;
        } else {
            return false;
        }
    }
    useFx(pos) {
    }
    hitFx(pos) {
        spawnParticles(pos, 25);
    }
    use(currentTime) {
        if (this.canUse(currentTime) &&
            this.actor.stateManager.setState('attack', {
                weapon: this,
                anim: 'attack',
                damageDelay: 240,
                damageDuration: 220,
                duration: 600,
                doesParry: true,
                friction: 2,
                speed: 2,
            })) {
            this.lastUsed = currentTime;
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
