import * as THREE from 'three';
import BaseWeapon from './_BaseWeapon';
import Globals from '../../utils/Globals';
import PFireball from '../../actors/PFireball';
import MyEventEmitter from '../../core/MyEventEmitter';

export default class Fireball extends BaseWeapon {
    constructor(actor, scene, isSpell = false) {
        super(actor, 'Fireball', 30, 100, 1500, isSpell); // name, damage, range, cooldown
        this.scene = scene;
        this.projectiles = [];
        this.tempVector = new THREE.Vector3();
        this.tempVector2 = new THREE.Vector3();
    }

    spellUse(currentTime) {
        if (this.canSpellUse(currentTime)
            && this.actor.stateManager.setState('attack', { damageDelay: 800, duration: 1200, anim: 'fireball', callback: () => this.shootFireball() })) {
            this.lastUsed = currentTime;
            return true;
        } else {
            return false;
        }
    }

    shootFireball() {
        const projectile = new PFireball({
            pos: this.actor.getShootData().position,
            dir: this.actor.getShootData().direction,
            speed: 30,
            dur: 20000,
        });
        this.projectiles.push(projectile);
    }

    update() { }
}