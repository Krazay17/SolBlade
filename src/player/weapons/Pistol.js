import BaseWeapon from './_BaseWeapon.js';
import soundPlayer from '../../core/SoundPlayer.js';
import MeshTrace from '../../core/MeshTrace.js';
import * as THREE from 'three';
import Globals from '../../utils/Globals.js';

export default class Pistol extends BaseWeapon {
    constructor(actor, scene) {
        super(actor, 'Pistol', 20, 250, .7); // name, damage, range, cooldown
        this.scene = scene;
        soundPlayer.loadSfx('gunshoot', '/assets/GunShoot.wav');
        this.meshTracer = new MeshTrace(this.scene);
    }
    use(currentTime, pos, dir) {
        if (this.canUse(currentTime) &&
            this.actor.stateManager.setState('attack', {
                weapon: this, anim: 'gunshoot', duration: 350
            })) {
            this.lastUsed = currentTime;
            const offSetPos = pos.clone().add(this.tempVector.set(0, .4, 0));
            let cameraPos = new THREE.Vector3();
            this.actor.cameraArm.getWorldPosition(cameraPos);
            this.hitActors.clear();


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
                    if (actor && actor !== this.actor && !this.hitActors.has(actor)) {
                        this.hitActors.add(actor);
                        actor.takeCC?.('knockback', this.tempVector.set(dir.x, 5, dir.z));
                        actor.changeHealth?.('damage', this.damage);
                        soundPlayer.playSound('gunshoot');
                        this.spawnHitParticles(actor.position);
                    }
                }
            });
            return true;
        }
        return false;
    }
}