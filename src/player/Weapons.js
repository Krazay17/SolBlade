import * as THREE from 'three';
import Globals from '../utils/Globals';
import MyEventEmitter from '../core/MyEventEmitter';

class Weapon {
    constructor(name = 'Weapon', damage = 1, range = 10, cooldown = 1) {
        this.name = name;
        this.damage = damage;
        this.range = range;
        this.cooldown = cooldown; // in seconds
        this.lastUsed = 0; // timestamp of last use
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3();
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
    }
    use(currentTime, pos, dir) {
        if (this.canUse(currentTime)) {
            this.lastUsed = currentTime;
            this.actor?.animator?.setState('swordSwing', { doesLoop: false, prio: 2 });
            const ray = new THREE.Raycaster(pos, dir, 0, this.range);
            const hitOwners = new Set();
            const rayLoop = () => {
                const startPos = this.actor.position.clone();
                const camDir = this.actor.camera.getWorldDirection(new THREE.Vector3());
                ray.set(startPos, camDir);
                const result = ray.intersectObjects(Globals.graphicsWorld.children, true);
                if (result.length > 0) {

                    for (let r of result) {
                        const target = r.object.userData.owner;
                        if (!target || target === this.actor) continue;

                        if (!hitOwners.has(target)) {
                            hitOwners.add(target);
                            target.takeDamage?.(this.damage, r.point, camDir);
                            target.takeCC?.('knockback', camDir);
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