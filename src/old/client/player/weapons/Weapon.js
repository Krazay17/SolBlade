import * as THREE from 'three';
import MyEventEmitter from '../../../../core/MyEventEmitter';
import MeshTrace from '../../core/MeshTrace';
import Player from '../Player';
import Game from '../../CGame';
import RAPIER from '@dimforge/rapier3d-compat';
import { COLLISION_GROUPS } from '../../../old/shared';

export default class Weapon {
    constructor(game, actor, data = {}) {
        const {
            name = 'Weapon',
            damage = 1,
            range = 10,
            cooldown = 1000,
            slot = 0,
            meshName = "GreatSword",
        } = data;
        /**@type {Game} */
        this.game = game;
        /**@type {Player} */
        this.actor = actor;
        this.name = name;
        this.damage = damage;
        this.range = range;
        this.cooldown = cooldown;
        this.slot = slot
        this.meshName = meshName;

        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.tempVector = new THREE.Vector3();
        this.tempVector2 = new THREE.Vector3();
        this.upVec = new THREE.Vector3(0, 1, 0);
        this.downVec = new THREE.Vector3(0, -1, 0);
        this.hitActors = new Set();

        this.damageDelay = 0;
        this.damageDuration = 0;
        this.isCharging = false;
        this.isDamaging = false;
        this.onAttackEnd = null;

        this.cube = new RAPIER.Cuboid(1, 1, 1);

        if (this.slot > 1) {
            this.cooldown *= 10;
        }
        this.lastUsed = -this.cooldown; // timestamp of last use
    }
    get stateManager() {
        return this.actor.stateManager;
    }
    get movement() { return this.actor.movement }
    get animation() { return this.actor.animationManager }
    get playAnimation() { return this.actor.animationManager.playAnimation.bind(this.actor.animationManager) }
    get playSound() { return this.game.soundPlayer.playPosSound.bind(this.game.soundPlayer) }
    canUse() {
        return (performance.now() - this.lastUsed) >= this.cooldown;
    }
    use() {
        const now = performance.now()
        if (this.canUse(now)) {
            this.lastUsed = now;
            this.isCharging = false;
            return true; // Weapon used successfully
        }
        return false; // Weapon is on cooldown
    }
    canSpellUse() {
        return (performance.now() - this.lastUsed) >= this.cooldown;
    }
    spellUse() {
        const now = performance.now()
        if (this.canSpellUse(now)) {
            this.lastUsed = now;
            return true; // Spell used successfully
        }
        return false; // Spell is on cooldown
    }
    charge() {
        this.isCharging = true;
        this.stateManager.setState('charge', { onExit: () => this.isCharging = false });
    }
    update(dt) {
        const now = performance.now()
        const delay = this.lastUsed + this.damageDelay;
        const modifiedDuration = this.modifiedDuration ? this.modifiedDuration : this.damageDuration;
        const duration = delay + modifiedDuration;
        if (delay < now && (duration > now)) {
            this.damageDelta = (now - delay) / modifiedDuration;
            this.damageTick(dt);
            this.isDamaging = true;
        } else if (this.isDamaging) {
            this.isDamaging = false;
            if (this.onAttackEnd) this.onAttackEnd();
        }
    }
    damageTick(dt) { }
    async equip(slot = '0') {
        const boneName = slot === '0' ? "handLWeapon" : "handRWeapon";
        const weaponBone = this.actor.mesh.getObjectByName(boneName);
        this.mesh = await this.game.meshManager.getMesh(this.meshName);
        weaponBone.add(this.mesh);
    }
    unequip() {
        if (this.mesh) {
            this.mesh.parent.remove(this.mesh);
        }
    }
    cubeTrace(pos, rot, radius, length, callback, debug = false) {
        this.cube.halfExtents = { x: radius, y: radius, z: length };

        if (rot instanceof THREE.Vector3) {
            const oldRot = rot;
            rot = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), oldRot);
        }

        this.game.physicsWorld.intersectionsWithShape(
            pos,
            rot,
            this.cube,
            callback,
            undefined,
            (COLLISION_GROUPS.ENEMY << 16) | COLLISION_GROUPS.PLAYER
        );

        if (debug) {
            const geom = new THREE.BoxGeometry(radius, radius, length);
            const mat = new THREE.MeshBasicMaterial({ color: "red" });
            const mesh = new THREE.Mesh(geom, mat);

            mesh.position.copy(pos);
            mesh.quaternion.copy(rot);
            this.game.graphics.add(mesh);

            setTimeout(() => {
                this.game.graphics.remove(mesh);
            }, 2000);
        }
    }
}

function swingMath(d, rev = false) {
    return rev ? 1 - d * 2 : d * 2 - 1;
}