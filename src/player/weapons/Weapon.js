import * as THREE from 'three';
import MyEventEmitter from '../../core/MyEventEmitter';
import MeshTrace from '../../core/MeshTrace';
import Player from '../Player';
import Game from '../../Game';

export default class Weapon {
    constructor(actor, name = 'Weapon', damage = 1, range = 10, cooldown = 1000, isSpell = false) {
        /**@type {Player} */
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

        /**@type {Game} */
        this.game = null;
        this.isSpell = isSpell;

        if (isSpell) {
            this.cooldown *= 8;
        }
        this.lastUsed = -this.cooldown; // timestamp of last use
    }
    get stateManager() {
        return this.actor.stateManager;
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
    canUse() {
        return (performance.now() - this.lastUsed) >= this.cooldown;
    }
    use() {
        const now = performance.now()
        if (this.canUse(now)) {
            this.lastUsed = now;
            return true; // Weapon used successfully
        }
        return false; // Weapon is on cooldown
    }
    update() { }
    meleeTrace(start, direction, length = 5, dot = 0.5, callback) {
        const actors = this.game.actorManager.hostiles;
        for (const actor of actors) {
            const pos = this.tempVector.copy(actor.position);
            const dist = pos.distanceTo(start);
            const dir = this.tempVector2.copy(pos).sub(start).normalize();

            if (actor === this.actor) continue;
            if (this.hitActors.has(actor)) continue;
            if (dist > length) continue;
            if (dir.dot(direction) < dot) continue;

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

            const meshTracer = new MeshTrace(this.game);
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