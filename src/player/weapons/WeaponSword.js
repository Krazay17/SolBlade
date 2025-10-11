import Weapon from "./Weapon";
import soundPlayer from "../../core/SoundPlayer";
import CameraFX from "../../core/CameraFX";
import * as THREE from "three";
import MyEventEmitter from "../../core/MyEventEmitter";
import Globals from "../../utils/Globals";
import { spawnParticles } from "../../actors/ParticleEmitter";
import GameScene from "../../scenes/GameScene";
import HitData from "../../core/HitData";

export default class WeaponSword extends Weapon {
    constructor(actor, scene, isSpell = false) {
        super(actor, 'Sword', 35, 2.9, 1200, isSpell); // name, damage, range, cooldown
        /**@type {GameScene} */
        this.scene = scene;
        this.traceDuration = 500; // duration of the sword trace in milliseconds
        soundPlayer.loadPosAudio('swordUse', '/assets/HeavySword.mp3');
        soundPlayer.loadPosAudio('swordHit', '/assets/HeavySwordHit.mp3');

        MyEventEmitter.on('netFx', (data) => {
            if (data.type === 'swordHit') {
                const fxPos = new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z);
                this.hitFx(fxPos);
            }
            if (data.type === 'swordUse') {
                const fxPos = new THREE.Vector3(data.pos.x, data.pos.y, data.pos.z);
                this.useFx(fxPos);
            }
        });

        this.debugMesh = null;
        if (Globals.DEBUG) {
            const geometry = new THREE.BoxGeometry(this.range, 1, 0.5);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
            this.debugMesh = new THREE.Mesh(geometry, material);
            this.debugMesh.visible = false;
            Globals.graphicsWorld.add(this.debugMesh);
        }
    }
    spellUse(currentTime) {
        if (this.canSpellUse(currentTime)
            && this.actor.stateManager.setState('attack', {
                duration: 1200,
                anim: 'spinSlash',
                damageDelay: 415,
                damageDuration: 450,
                weapon: this,
                doesParry: true
            })) {
            this.lastUsed = currentTime;
            this.enemyActors = this.scene.pawnManager.hostiles;
            this.hitActors.clear();
            this.useFx(this.actor.position);
            MyEventEmitter.emit('fx', { type: 'swordUse', pos: this.actor.position });
            return true;
        } else {
            return false;
        }
    }
    useFx(pos) {
        soundPlayer.playPosAudio('swordUse', pos);
    }
    hitFx(pos) {
        soundPlayer.playPosAudio('swordHit', pos);
        spawnParticles(pos, 25);
    }
    use(currentTime, pos, dir) {
        if (this.canUse(currentTime) &&
            this.actor.stateManager.setState('attack', {
                weapon: this,
                anim: 'attack',
                damageDelay: 240,
                damageDuration: 220,
                duration: 600,
                doesParry: true,
                friction: 2,
                speed: 2,
            })) {
            this.lastUsed = currentTime;
            this.enemyActors = this.scene.pawnManager.hostileMeshes;
            this.hitActors.clear();

            this.useFx(this.actor.position);
            MyEventEmitter.emit('fx', { type: 'swordUse', pos: this.actor.position });
        }
    }

    update() {
        this.meleeTrace(this.actor.position, this.actor.getCameraDirection(), this.range, 0.5, (target, camDir) => {
            const knockbackDir = this.tempVector2.copy(camDir).normalize().multiplyScalar(8);
            target.hit?.(new HitData({
                dealer: this.actor,
                target,
                type: 'physical',
                amount: -this.damage,
                stun: 500,
                impulse: knockbackDir
            }));
            this.actor.animationManager.changeTimeScale(0, 150);
            CameraFX.shake(0.14, 150);

            this.hitFx(target.position);
            MyEventEmitter.emit('fx', { type: 'swordHit', pos: target.position });
        });
        if (this.isSpell) {
            this.actor.movement.dashForward();
        }
    }
}
