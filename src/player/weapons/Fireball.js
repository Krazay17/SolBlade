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
            && this.actor.stateManager.setState('attack', { damageDelay: 850, duration: 1300, anim: 'fireball', callback: () => this.shootFireball() })) {
            this.lastUsed = currentTime;
            MyEventEmitter.emit('fx', { type: 'fireballUse', pos: this.actor.position });
            return true;
        } else {
            return false;
        }
    }

    shootFireball() {
        let pos = this.actor.getShootData().pos;
        const dir = this.actor.getShootData().dir;
        pos = pos.clone().add(dir.clone().multiplyScalar(2)); // Start a bit in front of the actor

        const projectile = new PFireball({
            pos: pos,
            dir: dir,
            speed: 25,
            dur: 20000,
            radius: 1.4,
        });
        this.projectiles.push(projectile);
    }

    update() { }
}