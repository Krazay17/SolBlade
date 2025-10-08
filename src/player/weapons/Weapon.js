import * as THREE from 'three';
import MyEventEmitter from '../../core/MyEventEmitter';
import MeshTrace from '../../core/MeshTrace';
import Globals from '../../utils/Globals';
import GameScene from '../../scenes/GameScene';
import Pawn from '../../actors/Pawn';

export default class Weapon {
    constructor(actor, name = 'Weapon', damage = 1, range = 10, cooldown = 1000, isSpell = false) {
        this.actor = actor;
        this.name = name;
        this.damage = damage;
        this.range = range;
        this.cooldown = cooldown;
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.tempVector = new THREE.Vector3();
        this.tempVector2 = new THREE.Vector3();
        this.hitActors = new Set();

        /**@type {GameScene} */
        this.scene = null; // To be set by subclasses if needed
        this.isSpell = isSpell;

        if (isSpell) {
            this.cooldown *= 8;
        }
        this.lastUsed = -this.cooldown; // timestamp of last use
    }
    canSpellUse(currentTime) {
        return (currentTime - this.lastUsed) >= this.cooldown;
    }
    /**
     * @param {number} currentTime
     * @param {THREE.Vector3} pos
     * @param {THREE.Vector3} dir
     */
    spellUse(currentTime, pos, dir) {
        if (this.canSpellUse(currentTime)) {
            this.lastUsed = currentTime;
            return true; // Spell used successfully
        }
        return false; // Spell is on cooldown
    }
    canUse(currentTime) {
        return (currentTime - this.lastUsed) >= this.cooldown;
    }
    /**
     * @param {number} currentTime
     * @param {THREE.Vector3} pos
     * @param {THREE.Vector3} dir
     */
    use(currentTime, pos, dir) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            return true; // Weapon used successfully
        }
        return false; // Weapon is on cooldown
    }
    update() { }
    meleeTrace(start, direction, length = 5, dot = 0.5, callback) {
        const actors = this.scene.getPawnManager().hostiles;
        for (const actor of actors) {
            const meshPos = this.tempVector.copy(actor.position);
            meshPos.y += actor.height / 2;
            const meshDist = meshPos.distanceTo(start);
            const meshDir = this.tempVector2.copy(meshPos).sub(start).normalize();

            if (actor === this.actor) continue;
            if (this.hitActors.has(actor)) continue;
            if (meshDist > length) continue;
            if (meshDir.dot(direction) < dot) continue;

            this.hitActors.add(actor);
            callback?.(actor, direction);
        }
    }
    rayLoop(start, dir, length, duration, callback) {
        let frameCount = 0;
        let hitActors = new Set();
        const loop = () => {
            frameCount++;
            if (frameCount % 5 !== 0) return;

            const meshTracer = new MeshTrace(this.scene);
            meshTracer.lineTrace(start, dir, length, (hits) => {
                for (const hit of hits) {
                    const actor = hit.object.userData.owner;
                    if (actor && actor !== this.actor) {
                        hitActors.add(actor, hit);
                        callback(hit);
                    }
                }
            });
        }
        MyEventEmitter.on('update', loop);
        setTimeout(() => {
            MyEventEmitter.off('update', loop);
        }, duration);
    }
}