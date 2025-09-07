import BaseWeapon from "./_BaseWeapon";
import soundPlayer from "../../core/SoundPlayer";
import CameraFX from "../../core/CameraFX";
import * as THREE from "three";
import Globals from "../../utils/Globals";

export default class Sword extends BaseWeapon {
    constructor(actor, scene) {
        super(actor, 'Sword', 35, 3, 1.2); // name, damage, range, cooldown
        this.scene = scene;
        this.traceDuration = 500; // duration of the sword trace in milliseconds
        soundPlayer.loadSfx('swordSwing', '/assets/HeavySword.mp3');
        soundPlayer.loadSfx('swordHit', '/assets/HeavySwordHit.mp3');
    }
    use(currentTime) {
        if (this.canUse(currentTime) &&
            this.actor.stateManager.setState('attack', {
                weapon: this, anim: 'attack', duration: 500, damageDelay: 200
            })) {
            this.lastUsed = currentTime;
            soundPlayer.playSound('swordSwing');
            this.enemyActors = this.scene.actorMeshes;
            this.enemyActors = this.enemyActors.filter(actor => actor !== this.actor);
            this.hitActors.clear();

        }
    }

    update() {
        this.meleeTrace(this.actor.position, this.actor.getCameraDirection(), this.range, 0.5, (target, camDir) => {
            const scaledCamDir = camDir.clone().normalize().multiplyScalar(15);
            target.takeDamage(this.actor, { type: 'melee', amount: this.damage }, { stun: 800, dir: scaledCamDir });
            soundPlayer.playSound('swordHit');
            this.actor.animator.hitFreeze();
            CameraFX.shake(0.14, 150);
            this.spawnHitParticles(target.position, 25);
        });
    }
}
