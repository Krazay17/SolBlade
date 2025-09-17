import BaseWeapon from "./_BaseWeapon";
import soundPlayer from "../../core/SoundPlayer";
import CameraFX from "../../core/CameraFX";
import * as THREE from "three";
import MyEventEmitter from "../../core/MyEventEmitter";
import Globals from "../../utils/Globals";

export default class Sword extends BaseWeapon {
    constructor(actor, scene, isSpell = false) {
        super(actor, 'Sword', 35, 2.8, 1200, isSpell); // name, damage, range, cooldown
        this.scene = scene;
        this.traceDuration = 500; // duration of the sword trace in milliseconds
        soundPlayer.loadPosAudio('swordUse', '/assets/HeavySword.mp3');
        soundPlayer.loadPosAudio('swordHit', '/assets/HeavySwordHit.mp3');
        soundPlayer.loadSound('parry', '/assets/Parry.mp3');

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
                damageDelay: 400,
                damageDuration: 450,
                weapon: this,
                doesParry: true
            })) {
            this.lastUsed = currentTime;
            this.enemyActors = this.scene.getOtherActorMeshes();
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
        this.spawnHitParticles(pos, 25);
    }
    use(currentTime) {
        if (this.canUse(currentTime) &&
            this.actor.stateManager.setState('attack', {
                weapon: this,
                anim: 'attack',
                damageDelay: 200,
                damageDuration: 160,
                duration: 600,
                doesParry: true,
            })) {
            this.lastUsed = currentTime;
            this.enemyActors = this.scene.actorMeshes;
            this.enemyActors = this.enemyActors.filter(actor => actor !== this.actor);
            this.hitActors.clear();

            this.useFx(this.actor.position);
            MyEventEmitter.emit('fx', { type: 'swordUse', pos: this.actor.position });
        }
    }

    update() {
        this.meleeTrace(this.actor.position, this.actor.getCameraDirection(), this.range, 0.5, (target, camDir) => {
            const scaledCamDir = camDir.clone().normalize().multiplyScalar(12.5);
            target.takeDamage(this.actor, { type: 'melee', amount: this.damage }, { stun: 700, dir: scaledCamDir });
            this.actor.animator.hitFreeze();
            CameraFX.shake(0.14, 150);

            //this.hitFx(target.position, scaledCamDir);
            MyEventEmitter.emit('fx', { type: 'swordHit', pos: target.position });
        });
        if (this.isSpell) {
            this.actor.movement.dashForward();
            console.log("DASHED!");
        }
    }
}
