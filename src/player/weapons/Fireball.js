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
            && this.actor.stateManager.setState('attack', { damageDelay: 600, duration: 1000, anim: 'fireball', callback: () => this.shootFireball() })) {
            this.lastUsed = currentTime;
            return true;
        } else {
            return false;
        }
    }

    shootFireball() {
        let pos = this.actor.getShootData().position;
        const dir = this.actor.getShootData().direction;
        pos = pos.clone().add(dir.clone().multiplyScalar(2)); // Start a bit in front of the actor

        const projectile = new PFireball({
            pos: pos,
            dir: dir,
            speed: 11,
            dur: 20000,
            scale: { x: 2, y: 2, z: 2 },
            radius: 2
        });
        this.projectiles.push(projectile);
    }

    update() { }
}