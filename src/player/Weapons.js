import * as THREE from 'three';
import Globals from '../utils/Globals';
import MyEventEmitter from '../core/MyEventEmitter';
import soundPlayer from '../core/SoundPlayer';
import MeshTrace from '../core/MeshTrace';

class Weapon {
    constructor(name = 'Weapon', damage = 1, range = 10, cooldown = 1) {
        this.name = name;
        this.damage = damage;
        this.range = range;
        this.cooldown = cooldown; // in seconds
        this.lastUsed = 0; // timestamp of last use
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.tempVector = new THREE.Vector3();
        this.tempVector2 = new THREE.Vector3();
    }

    canUse(currentTime) {
        return (currentTime - this.lastUsed) >= this.cooldown * 1000;
    }

    use(currentTime) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            return true; // Weapon used successfully
        }
        return false; // Weapon is on cooldown
    }
}

export class Pistol extends Weapon {
    constructor(scene) {
        super('Pistol', 10, 50, 0.5); // name, damage, range, cooldown
        this.scene = scene;
    }
    use(currentTime, pos, dir) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            console.log('Pistol fired!');

            const visual = () => {
                new THREE.LineBasicMaterial({
                    color: 0x00FF00,
                });
                new THREE.Line()
                const shotGeom = new THREE.CylinderGeometry(.1, .1, 200, 6);
                const shotMat = new THREE.MeshBasicMaterial({
                    color: 0xFF0000,
                });
                const shotMesh = new THREE.Mesh(shotGeom, shotMat);
                shotMesh.position.copy(pos);
                const target = pos.add(dir);
                shotMesh.lookAt(target)
                this.scene.add(shotMesh);
            }
            visual();

            const data = () => {
                this.fireRay(pos, dir);
            }
            return true;
        }
        return false;
    }
}

export class Sword extends Weapon {
    constructor(actor, scene) {
        super('Sword', 25, 2, .7); // name, damage, range, cooldown
        this.actor = actor;
        this.scene = scene;
        this.traceDuration = 500; // duration of the sword trace in milliseconds
        soundPlayer.loadSound('swordSwing', '/assets/SwordSwing.wav');
        soundPlayer.loadSound('swordHit', '/assets/SwordHit.wav');
    }
    use(currentTime) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            soundPlayer.playSound('swordSwing');
            this.actor.stateManager.setState('attack');
            const actors = this.scene.actorMeshes;
            let hitActors = new Set();

            const loop = () => {
                const startPos = this.actor.position.clone();
                const camDir = this.tempVector2.copy(this.actor.getCameraDirection()).normalize();
                for (const mesh of actors) {
                    const owner = mesh.userData.owner;
                    const meshPos = owner.position.clone();
                    const meshDist = meshPos.distanceTo(startPos);
                    const meshDir = meshPos.clone().sub(startPos).normalize();

                    if (owner === this.actor) continue;
                    if (meshDist > this.range) continue;
                    if (meshDir.dot(camDir) < 0.5) continue;
                    if (hitActors.has(owner)) continue;
                    console.log('Hit actor:', owner);

                    hitActors.add(owner);
                    owner.takeDamage?.(this.damage);
                    owner.takeCC?.('knockback', camDir);
                    soundPlayer.playSound('swordHit');
                }
            }
            MyEventEmitter.on('postUpdate', loop);
            setTimeout(() => {
                MyEventEmitter.off('postUpdate', loop);
            }, this.traceDuration);
        }
    }
}

function rayLoop(start, dir, length, duration, callback) {
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
    MyEventEmitter.on('postUpdate', loop);
    setTimeout(() => {
        MyEventEmitter.off('postUpdate', loop);
    }, duration);
}