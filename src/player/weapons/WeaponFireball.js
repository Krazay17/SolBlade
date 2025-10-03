import * as THREE from 'three';
import Weapon from './Weapon';
import ProjectileFireball from '../../actors/ProjectileFireball';
import MyEventEmitter from '../../core/MyEventEmitter';

export default class WeaponFireball extends Weapon {
    constructor(actor, scene, isSpell = false) {
        super(actor, 'Fireball', 30, 100, 1500, isSpell); // name, damage, range, cooldown
        this.scene = scene;
        this.projectiles = [];
        this.tempVector = new THREE.Vector3();
        this.tempVector2 = new THREE.Vector3();
    }

    spellUse(currentTime, pos, dir) {
        if (this.canSpellUse(currentTime)
            && this.actor.stateManager.setState('attack', { damageDelay: 850, duration: 1300, anim: 'fireball', callback: () => this.shootFireball() })) {
            this.lastUsed = currentTime;
            MyEventEmitter.emit('fx', { type: 'fireballUse', pos: this.actor.position });
            return true;
        } else {
            return false;
        }
    }

    shootFireball() {
        let pos = this.actor.getShootData().camPos;
        const dir = this.actor.getShootData().dir;
        pos = pos.add(dir.clone().multiplyScalar(2)); // Start a bit in front of the actor

        const projectile = new ProjectileFireball({
            pos: pos,
            dir: dir,
            speed: 35,
            dur: 30000,
            radius: 1.15,
        });
        this.projectiles.push(projectile);
    }

    update() { }
}