import * as THREE from 'three';
import BaseWeapon from './_BaseWeapon';
import Projectile from '../../actors/Projectile';
import Globals from '../../utils/Globals';

export default class Fireball extends BaseWeapon {
    constructor(actor, scene, isSpell = false) {
        super(actor, 'Fireball', 30, 100, 1500, isSpell); // name, damage, range, cooldown
        this.scene = scene;
        this.projectiles = [];
        this.gravity = new THREE.Vector3(0, -9.81, 0);
        this.tempVector = new THREE.Vector3();
        this.tempVector2 = new THREE.Vector3();
    }

    spellUse(currentTime) {
        if (this.canSpellUse(currentTime)) {
            this.lastUsed = currentTime;
            const projectile = new Projectile(
                this.actor.getShootData().position,
                this.actor.getShootData().direction,
                this.damage,
            )
            Globals.graphicsWorld.add(projectile);
            this.projectiles.push(projectile);

            return true; // Weapon used successfully
        }
        return false; // Weapon is on cooldown
    }

    update() { }
}