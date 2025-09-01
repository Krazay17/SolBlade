import * as THREE from 'three';
import Globals from '../utils/Globals';
import MyEventEmitter from '../core/MyEventEmitter';
import soundPlayer from '../core/SoundPlayer';
import MeshTrace from '../core/MeshTrace';

class Weapon {
    constructor(actor, name = 'Weapon', damage = 1, range = 10, cooldown = 1) {
        this.actor = actor;
        this.name = name;
        this.damage = damage;
        this.range = range;
        this.cooldown = cooldown; // in seconds
        this.lastUsed = 0; // timestamp of last use
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.tempVector = new THREE.Vector3();
        this.tempVector2 = new THREE.Vector3();
        this.hitActors = new Set();
    }

    canUse(currentTime) {
        const otherWeapon = this.actor.weaponR === this ? this.actor.weaponL : this.actor.weaponR;
        return (currentTime - this.lastUsed) >= this.cooldown * 1000;
    }

    use(currentTime) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            return true; // Weapon used successfully
        }
        return false; // Weapon is on cooldown
    }

    update() { }

    meleeTrace(start, direction, length = 5, dot = 0.5, callback) {
        const actors = this.scene.actorMeshes;
        const startPos = start.clone();
        const camDir = direction.clone().normalize();
        for (const mesh of actors) {
            const target = mesh.userData.owner;
            const meshPos = target.position.clone();
            const meshDist = meshPos.distanceTo(startPos);
            const meshDir = meshPos.clone().sub(startPos).normalize();

            if (target === this.actor) continue;
            if (this.hitActors.has(target)) continue;
            if (meshDist > length) continue;
            if (meshDir.dot(camDir) < dot) continue;

            this.hitActors.add(target);
            callback?.(target, camDir);
        }
    }
}

export class Pistol extends Weapon {
    constructor(actor, scene) {
        super(actor, 'Pistol', 10, 250, 0.5); // name, damage, range, cooldown
        this.scene = scene;
        soundPlayer.loadSound('gunshoot', '/assets/GunShoot.wav');
        this.meshTracer = new MeshTrace(this.scene);
    }
    use(currentTime, pos, dir) {
        if (this.canUse(currentTime) &&
            this.actor.stateManager.setState('attack', {
                weapon: this, anim: 'gunshoot', duration: 500
            })) {
            this.lastUsed = currentTime;
            const offSetPos = pos.clone().add(this.tempVector.set(0, .4, 0));
            let cameraPos = new THREE.Vector3();
            this.actor.cameraArm.getWorldPosition(cameraPos);


            const fx = () => {
                const lineGeom = new THREE.BufferGeometry().setFromPoints([
                    offSetPos.clone(),
                    offSetPos.clone().add(dir.clone().normalize().multiplyScalar(this.range))
                ]);
                const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0xff0000 }));
                Globals.graphicsWorld.add(line);

                setTimeout(() => {
                    Globals.graphicsWorld.remove(line);
                }, 500);
                soundPlayer.playSound('gunshoot');
            }
            fx();
            this.meshTracer.lineTrace(cameraPos, dir, this.range, (hits) => {
                for (const hit of hits) {
                    const actor = hit.object.userData.owner;
                    if (actor && actor !== this.actor) {
                        this.hitActors.add(actor);
                        actor.takeDamage?.(this.damage);
                        actor.takeCC?.('knockback', this.tempVector.set(0, 5, 0));
                        soundPlayer.playSound('gunshoot');
                    }
                }
            });

            return true;
        }
        return false;
    }
}

export class Sword extends Weapon {
    constructor(actor, scene) {
        super(actor, 'Sword', 25, 2, .7); // name, damage, range, cooldown
        this.scene = scene;
        this.traceDuration = 500; // duration of the sword trace in milliseconds
        soundPlayer.loadSound('swordSwing', '/assets/SwordSwing.wav');
        soundPlayer.loadSound('swordHit', '/assets/SwordHit.wav');
    }
    use(currentTime) {
        if (this.canUse(currentTime) &&
            this.actor.stateManager.setState('attack', {
                weapon: this, anim: 'attack', duration: 500
            })) {
            this.lastUsed = currentTime;
            soundPlayer.playSound('swordSwing');
            this.actor.stateManager.setState('attack', { weapon: this, anim: 'attack' });
            this.enemyActors = this.scene.actorMeshes;
            this.enemyActors = this.enemyActors.filter(actor => actor !== this.actor);
            this.hitActors.clear();

        }
    }

    update() {
        this.meleeTrace(this.actor.position, this.actor.getCameraDirection(), this.range, 0.5, (target, camDir) => {
            const scaledCamDir = camDir.clone().normalize().multiplyScalar(30);
            target.takeDamage?.(this.damage);
            target.takeCC?.('knockback', scaledCamDir);
            soundPlayer.playSound('swordHit');
        });
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

// const loop = () => {
//     const startPos = this.actor.position.clone();
//     const camDir = this.tempVector2.copy(this.actor.getCameraDirection()).normalize();
//     for (const mesh of actors) {
//         const owner = mesh.userData.owner;
//         const meshPos = owner.position.clone();
//         const meshDist = meshPos.distanceTo(startPos);
//         const meshDir = meshPos.clone().sub(startPos).normalize();

//         if (owner === this.actor) continue;
//         if (meshDist > this.range) continue;
//         if (meshDir.dot(camDir) < 0.5) continue;
//         if (hitActors.has(owner)) continue;

//         hitActors.add(owner);
//         owner.takeDamage?.(this.damage);
//         owner.takeCC?.('knockback', camDir);
//         soundPlayer.playSound('swordHit');
//     }
// }
// MyEventEmitter.on('postUpdate', loop);
// setTimeout(() => {
//     MyEventEmitter.off('postUpdate', loop);
// }, this.traceDuration);