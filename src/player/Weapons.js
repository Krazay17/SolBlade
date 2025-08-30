import * as THREE from 'three';
import Globals from '../utils/Globals';
import MyEventEmitter from '../core/MyEventEmitter';
import soundPlayer from '../core/SoundPlayer';

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
    constructor(actor) {
        super('Sword', 25, 2, .7); // name, damage, range, cooldown
        this.actor = actor;
        this.scene = actor?.scene;
        this.traceDuration = 500; // duration of the sword trace in milliseconds
        soundPlayer.loadSound('swordSwing', '/assets/SwordSwing.wav');
        soundPlayer.loadSound('swordHit', '/assets/SwordHit.wav');
    }
    use(currentTime, pos, dir) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            soundPlayer.playSound('swordSwing');
            this.actor.stateManager.setState('attack');
            const ray = new THREE.Raycaster(pos, dir, 0, this.range);
            const hitOwners = new Set();
            let frameCount = 0;
            const rayLoop = () => {
                frameCount++;
                if (frameCount % 5 !== 0) return;

                const startPos = this.tempVector.copy(this.actor.position);
                const camDir = this.tempVector2.copy(this.actor.getCameraDirection());
                let enemyMeshs = [];
                ray.set(startPos, camDir);
                Globals.scene.enemieActorsMap.forEach((mesh, actor) => {
                    if (actor === this.actor) return;
                    if (actor.position.distanceTo(startPos) < this.range && !enemyMeshs.includes(mesh)) {
                        enemyMeshs.push(...mesh);
                    }
                });
                if (enemyMeshs.length === 0) return;
                const result = ray.intersectObjects(enemyMeshs, false);
                if (result.length > 0) {
                    for (let r of result) {
                        const target = r.object.userData.owner;
                        if (!target || target === this.actor) continue;

                        if (!hitOwners.has(target)) {
                            console.log('Sword hit:', target.name);
                            hitOwners.add(target);
                            target.healthComponent.takeDamage?.(this.damage, r.point, camDir);
                            target.takeCC?.('knockback', camDir);
                            soundPlayer.playSound('swordHit');
                        }
                    }
                }
            }
            MyEventEmitter.on('postUpdate', rayLoop);
            setTimeout(() => {
                MyEventEmitter.off('postUpdate', rayLoop);
            }, this.traceDuration);
        }
        return false;
    }
}