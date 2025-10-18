import * as THREE from 'three';
import Weapon from './Weapon';
import MyEventEmitter from '../../core/MyEventEmitter';

export default class WeaponFireball extends Weapon {
    constructor(actor, game, isSpell = false) {
        super(actor, 'Fireball', 30, 100, 1500, isSpell); // name, damage, range, cooldown
        this.game = game;
        this.projectiles = [];
        this.tempVector = new THREE.Vector3();
        this.tempVector2 = new THREE.Vector3();
    }

    spellUse(currentTime) {
        if (this.canSpellUse(currentTime)
            && this.actor.stateManager.setState('attack', { damageDelay: 850, duration: 1300, anim: 'fireball', callback: () => this.shootFireball(1, 35, 25) })) {
            this.lastUsed = currentTime;
            this.game.soundPlayer.playPosSound('fireWhoosh', this.actor.position);
            return true;
        } else {
            return false;
        }
    }
    use(time) {
        if (this.canUse(time) &&
            this.stateManager.setState('attack', {
                weapon: this,
                anim: 'gunShoot',
                duration: 550,
                damageDelay: 100,
                callback: () => this.shootFireball(.3, 50, 10),
            })) {
            return true;
        }
    }

    shootFireball(radius = 1, speed = 35, damage = 10) {
        let pos = this.actor.getShootData().camPos;
        const dir = this.actor.getShootData().dir;
        pos = pos.add(dir.clone().multiplyScalar(1.5)); // Start a bit in front of the actor

        const projectile = this.game.actorManager.spawnActor('fireball', {
            pos,
            dir,
            radius,
            damage,
            speed,
            dur: 30000,
            owner: this.actor,
        }, false, true);
        this.projectiles.push(projectile);
    }
}