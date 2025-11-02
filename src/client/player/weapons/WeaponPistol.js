import Weapon from './Weapon.js';
import MeshTrace from '../../core/MeshTrace.js';
import * as THREE from 'three';
import MyEventEmitter from '../../core/MyEventEmitter.js';
import { spawnParticles } from '../../actors/ParticleEmitter.js';
import HitData from '../../core/HitData.js';
import RAPIER from '@dimforge/rapier3d-compat';
import Game from '../../Game.js';

export default class WeaponPistol extends Weapon {
    constructor(game, actor, slot = '0') {
        super(game, actor, {
            weapon: 'Pistol',
            damage: 20,
            range: 50,
            cooldown: 800,
            slot
        }); // name, damage, range, cooldown
        this.game.soundPlayer.loadPosAudio('pistolUse', 'assets/PistolUse.wav');
        this.meshTracer = new MeshTrace(this.game, this.actor);

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
        Game.getGame().graphicsWorld.add(line);
        setTimeout(() => {
            Game.getGame().graphicsWorld.remove(line);
        }, 500);

    }
    use() {
        if (super.use() &&
            this.actor.stateManager.setState('attack', {
                weapon: this, anim: 'gunShoot', duration: 350
            })) {
            const { dir, pos, camPos } = this.actor.getShootData();
            this.hitActors.clear();
            this.game.soundPlayer.playPosSound('pistolShoot', pos);
            this.playAnimation(this.hand, false, undefined);

            this.meshTracer.shapeTrace(camPos, dir, this.range, 0.1, (/**@type {RAPIER.ColliderShapeCastHit}*/r) => {
                if (r) {
                    this.game.fxManager.spawnFX(undefined, { pos: r.witness1 });
                    const target = r.collider.actor;
                    if (!target) return;
                    target.hit(new HitData({
                        dealer: this.actor,
                        target,
                        impulse: dir.multiplyScalar(2),
                        amount: 15,
                        stun: 50,
                        dim: 500,
                    }))
                }
            })

            // this.meshTracer.multiLineTrace(camPos, dir, this.game.actorManager.hostiles, this.range, pos, (hit) => {
            //     const actor = hit.object.userData.owner;
            //     if (actor && actor !== this.actor && !this.hitActors.has(actor)) {
            //         this.hitActors.add(actor);
            //         const scaledDir = dir.clone().normalize().multiplyScalar(4);
            //         actor.hit(new HitData({
            //             dealer: this.actor,
            //             target: actor,
            //             type: 'bullet',
            //             stun: 50,
            //             dim: 700,
            //             impulse: scaledDir,
            //             amount: this.damage,
            //             hitPosition: hit.point,
            //         }));
            //     }
            // }, 3, .15);

            return true;
        }
        return false;
    }
}