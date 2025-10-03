import Weapon from './Weapon.js';
import soundPlayer from '../../core/SoundPlayer.js';
import MeshTrace from '../../core/MeshTrace.js';
import * as THREE from 'three';
import Globals from '../../utils/Globals.js';
import MyEventEmitter from '../../core/MyEventEmitter.js';
import { spawnParticles } from '../../actors/ParticleEmitter.js';

export default class WeaponPistol extends Weapon {
    constructor(actor, scene, isSpell = false) {
        super(actor, 'Pistol', 20, 50, 800, isSpell); // name, damage, range, cooldown
        this.scene = scene;
        soundPlayer.loadPosAudio('pistolUse', 'assets/PistolUse.wav');
        this.meshTracer = new MeshTrace(this.scene);

        MyEventEmitter.on('netFx', (data) => {
            if (data.type === 'pistolUse') {
                const fxPos = new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z);
                const fxDir = new THREE.Vector3(data.dir.x, data.dir.y, data.dir.z);
                this.useFx(fxPos, fxDir);
            }
            if (data.type === 'bulletHit') {
                const fxPos = new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z);
                const fxDir = new THREE.Vector3(data.dir.x, data.dir.y, data.dir.z);
                this.hitFx(fxPos, fxDir);
            }
        });
    }
    hitFx(pos, dir) {
        spawnParticles(pos, 10);
    }
    useFx(pos, dir) {
        const lineGeom = new THREE.BufferGeometry().setFromPoints([
            pos.clone(),
            pos.clone().add(dir.clone().normalize().multiplyScalar(this.range))
        ]);
        const line = new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color: 0xff0000 }));
        Globals.graphicsWorld.add(line);
        setTimeout(() => {
            Globals.graphicsWorld.remove(line);
        }, 500);

        soundPlayer.playPosAudio('pistolUse', pos.clone());
    }
    use(currentTime, pos, dir) {
        if (this.canUse(currentTime) &&
            this.actor.stateManager.setState('attack', {
                weapon: this, anim: 'gunShoot', duration: 250
            })) {
            this.lastUsed = currentTime;
            const offSetPos = pos.clone().add(this.tempVector.set(0, .8, 0));
            let cameraPos = this.tempVector2;
            this.actor.cameraArm.getWorldPosition(cameraPos);
            this.hitActors.clear();

            this.useFx(offSetPos, dir);
            MyEventEmitter.emit('fx', { type: 'pistolUse', pos: offSetPos, dir: dir });

            this.meshTracer.multiLineTrace(cameraPos, dir, this.hostilePawns(), this.range, offSetPos, (hit) => {
                const actor = hit.object.userData.owner;
                if (actor && actor !== this.actor && !this.hitActors.has(actor)) {
                    this.hitActors.add(actor);
                    const scaledDir = dir.clone().normalize().multiplyScalar(4);
                    actor.takeDamage(this.actor, { type: 'bullet', amount: this.damage }, { stun: 80, dir: scaledDir, dim: 1000 });

                    this.hitFx(hit.point, dir);
                    MyEventEmitter.emit('fx', { type: 'bulletHit', pos: hit.point, dir: dir });
                }
            }, 3, .15);

            return true;
        }
        return false;
    }
    spellUse(currentTime, pos, dir) {
        console.log('spellUse');
    }
}