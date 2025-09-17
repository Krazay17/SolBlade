import * as THREE from 'three';
import MyEventEmitter from '../../core/MyEventEmitter';
import MeshTrace from '../../core/MeshTrace';
import Globals from '../../utils/Globals';

export default class BaseWeapon {
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

        this.scene = null; // To be set by subclasses if needed
        this.isSpell = isSpell;

        if(isSpell) {
            this.cooldown *= 8;
        }
        this.lastUsed = -this.cooldown; // timestamp of last use
    }

    canSpellUse(currentTime) {
        return (currentTime - this.lastUsed) >= this.cooldown;
    }

    spellUse(currentTime) {
        if (this.canSpellUse(currentTime)) {
            this.lastUsed = currentTime;
            return true; // Spell used successfully
        }
        return false; // Spell is on cooldown
    }

    canUse(currentTime) {
        const otherWeapon = this.actor.weaponR === this ? this.actor.weaponL : this.actor.weaponR;
        return (currentTime - this.lastUsed) >= this.cooldown;
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

    spawnHitParticles(position, count = 8) {
        for (let i = 0; i < count; i++) {
            const geometry = new THREE.SphereGeometry(0.07, 8, 8);
            const material = new THREE.MeshLambertMaterial({
                color: 0xff2222,
                emissive: 0xff2222,
                emissiveIntensity: 1,
                blending: THREE.AdditiveBlending,
            });
            const orb = new THREE.Mesh(geometry, material);

            // Random direction and speed
            const dir = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 1.5,
                (Math.random() - 0.5) * 2
            ).normalize().multiplyScalar(0.5 + Math.random() * 0.7);

            orb.position.copy(position);

            Globals.graphicsWorld.add(orb);

            // Animate and remove after 0.4s
            const start = performance.now();
            function animate() {
                const elapsed = performance.now() - start;
                orb.position.add(dir.clone().multiplyScalar(0.04));
                orb.material.opacity = Math.max(0, 1 - elapsed / 400);
                orb.material.transparent = true;
                if (elapsed < 400) {
                    requestAnimationFrame(animate);
                } else {
                    Globals.graphicsWorld.remove(orb);
                    orb.geometry.dispose();
                    orb.material.dispose();
                }
            }
            animate = animate.bind(this);
            animate();
        }
    }
}