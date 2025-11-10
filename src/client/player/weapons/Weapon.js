import * as THREE from 'three';
import MyEventEmitter from '../../core/MyEventEmitter';
import MeshTrace from '../../core/MeshTrace';
import Player from '../Player';
import Game from '../../CGame';

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
        this.hitActors = new Set();

        this.damageDelay = 0;
        this.damageDuration = 0;
        this.isCharging = false;

        if (this.slot > 1) {
            this.cooldown *= 8;
        }
        this.lastUsed = -this.cooldown; // timestamp of last use
    }
    get stateManager() {
        return this.actor.stateManager;
    }
    get movement() { return this.actor.movement }
    get animation() { return this.actor.animationManager }
    get playAnimation() { return this.actor.animationManager.playAnimation.bind(this.actor.animationManager) }
    get playSound() {return this.game.soundPlayer.playPosSound.bind(this.game.soundPlayer)}
    get hand() { return this.slot === '0' ? 'attackLeft' : 'attackRight'; }
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
            this.isCharging = false;
            return true; // Weapon used successfully
        }
        return false; // Weapon is on cooldown
    }
    charge() {
        this.isCharging = true;
        this.stateManager.setState('charge', { onExit: () => this.isCharging = false });
    }
    update(dt) {
        const delay = this.lastUsed + this.damageDelay;
        const duration = delay + this.damageDuration;
        if (delay < performance.now() && (duration > performance.now())) {
            this.damageTick(dt);
        }
    }
    damageTick(dt) { }
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
    async equip(slot = '0') {
        const boneName = slot === '0' ? "handLWeapon": "handRWeapon";
        const weaponBone = this.actor.mesh.getObjectByName(boneName);
        this.mesh = await this.game.meshManager.getMesh(this.meshName);
        weaponBone.add(this.mesh);
    }
    unequip() {
        if(this.mesh) {
            this.mesh.parent.remove(this.mesh);
        }
    }
}