import * as THREE from 'three';
import LocalData from '../core/LocalData';
import MyEventEmitter from '../core/MyEventEmitter';
import * as Weapon from './weapons/index';
import { tryUpdatePosition } from '../core/NetManager';
import CameraFX from '../core/CameraFX';
import PlayerMovement from './PlayerMovement';
import DevMenu from '../ui/DevMenu';
import NamePlate from '../core/Nameplate';
import PlayerStateManager from './playerStates/PlayerStateManager';
import HitData from '../core/HitData';
import { menuButton } from '../ui/Menu';
import Energy from '../core/Energy';
import { Ray } from '@dimforge/rapier3d-compat';
import { lerpTo } from '../utils/Utils';
import { Actor } from '@solblade/shared';

export default class Player extends Actor {
    constructor(game, data = {}) {
        super(game, {
            ...data,
            type: "player",
        });
        this.tick = true;

        this.scene = game.scene;
        this.parry = false;
        this.dimmed = 0;
        this.crownMesh = null;
        this.meshRotation = new THREE.Quaternion();
        this._meshRot = { x: 0, z: 0 };
        this.dashCost = 25;
        this.doubleJumpCost = 40;
        this.leftWeapon = data.leftWeapon ?? "Fireball";
        this.rightWeapon = data.rightWeapon ?? "Blade";
        /**@type {THREE.Group} */
        this.leftWeaponBone = null;
        /**@type {THREE.Group} */
        this.rightWeaponBone = null;
        this.setWeapon("0", this.leftWeapon);
        this.setWeapon("1", this.rightWeapon)

        this.upVec = new THREE.Vector3(0, 1, 0);
        this.camQuat = new THREE.Quaternion();

        // Local Player setup
        if (!this.isRemote) {
            this.localInit();
        } else {
            this.remoteInit();
        }
    }

    get rotation() { return this.rot };
    set rotation(r) {
        if (this.rot.x === r.x &&
            this.rot.y === r.y &&
            this.rot.z === r.z &&
            this.rot.w === r.w
        ) return;

        this.rot.copy(r);
        if (this.isRemote) return;
        MyEventEmitter.emit('playerRotation', { x: this.rot.x, y: this.rot.y, z: this.rot.z, w: this.rot.w, yaw: this.yaw });
    }
    get yaw() { return this._yaw }
    set yaw(v) {
        this._yaw = v;

        if (this.isRemote) {
            this.targetYaw.setFromAxisAngle(this.upVec, v);
        } else {
            this.graphics.quaternion.setFromAxisAngle(this.upVec, v);
        }
    }
    get meshRot() { return this._meshRot }
    set meshRot({ x, z }) {
        if (this.mesh.rotation.x === x &&
            this.mesh.rotation.z === z
        ) return;
        this._meshRot = { x, z };
        if (this.isRemote) return;
        MyEventEmitter.emit('meshRotation', { x, z })
    }
    setId(id) {
        super.setId(id);
        if (!this.isRemote) {
            MyEventEmitter.emit('playerIdChange', id);
        }
    }
    meshReady() {
        this.leftWeaponBone = this.mesh.getObjectByName("handLWeapon");
        this.rightWeaponBone = this.mesh.getObjectByName("handRWeapon");
    }
    localInit(game) {
        this.tick = false
        this.input = this.game.input;
        this.camera = this.game.camera;

        this.direction = new THREE.Vector3();
        this.tempVector = new THREE.Vector3();
        this.energy = new Energy(this, 100);
        this.movement = new PlayerMovement(this.game, this);
        this.stateManager = new PlayerStateManager(this.game, this);
        this.devMenu = new DevMenu(this, this.movement);

        menuButton('spikeMan', () => {
            this.assignMesh('spikeMan');
        });
        menuButton('knightGirl', () => {
            this.assignMesh('knightGirl');
        });

        this.cameraArm = new THREE.Object3D();
        this.cameraArm.position.set(.666, .666, -.333);
        this.add(this.cameraArm);
        this.camera.position.z = 1.666;
        this.cameraArm.add(this.camera);
        CameraFX.init(this.camera);

        MyEventEmitter.on('keyJustDown', (e) => {
            if (e === 'Space') this.stateManager.setState('jump');
        });

        MyEventEmitter.on('KeyPressed', (key) => {
            if (key === 'KeyH') {
                this.die('the void');
            }
        });


        MyEventEmitter.on('test', () => {
            console.log('testFunc')
            this.stateManager.setState('stun');
        })
    }
    remoteInit() {
        this.namePlate = new NamePlate(this, this.height);
        if (this.data.hasCrown) {
            this.pickupCrown();
        }
    }
    update(dt, time) {
        if (!this.tick) return;
        super.update(dt, time);

        if (!this.isRemote) {
            if (this.energy) this.energy.update(dt);
            this.handleInput(dt, time);
            tryUpdatePosition({ pos: this.position, rot: this.rotY });
            CameraFX.update(dt);
        }
        this.mesh.rotation.x = lerpTo(this.mesh.rotation.x, this.meshRot.x, 5 * dt)
        this.mesh.rotation.z = lerpTo(this.mesh.rotation.z, this.meshRot.z, 5 * dt)
    }

    async pickupCrown() {
        if (!this.crownMesh) {
            this.crownMesh = await this.game.meshManager.getMesh('crown', 0.4);
            this.crownMesh.position.set(0, 1.5, 0);
            this.crownMesh.scale.set(.4, .4, .4);
        }
        this.add(this.crownMesh);
    }
    touch() { }
    setScene(newScene) {
        this.scene = newScene;
        this.sceneName = this.scene.sceneName;
        this.body.velocity = { x: 0, y: 0, z: 0 };
    }
    sceneReady() {
        if (LocalData.sceneName !== this.sceneName) {
            LocalData.sceneName = this.sceneName;
            this.position = this.scene.spawnPos;
        }
        if (this.body) {
            this.wakeUp();
        }
        this.tick = true;

    }
    async assignMesh(skin) {
        if (await super.assignMesh(skin)) {
            if (this.isRemote) return;
            MyEventEmitter.emit('playerStateUpdate', this);
        }
    }
    stateUpdate(data) {
        const { skin } = data;
        if (skin && (this.skin !== skin)) {
            this.assignMesh(skin);
        }
    }
    dropCrown() {
        if (this.crownMesh) {
            this.remove(this.crownMesh);
        }
    }
    setWeapon(slot, weapon) {
        if (!weapon) {
            this.setWeaponMesh(slot, weapon);
            this[`weapon${slot}`] = null;
            return;
        }
        const weaponName = weapon?.name || weapon;
        switch (weaponName) {
            case 'Fireball':
                weapon = new Weapon.WeaponFireball(this.game, this, slot);
                break;
            case 'Pistol':
                weapon = new Weapon.WeaponPistol(this.game, this, slot);
                break;
            case 'Blade':
                weapon = new Weapon.WeaponBlade(this.game, this, slot);
                break;
            case 'Scythe':
                weapon = new Weapon.WeaponScythe(this.game, this, slot);
                break;
            case 'Sword':
                weapon = new Weapon.WeaponSword(this.game, this, slot);
                break;
            default:
                weapon = null;
                break;
        }
        this[`weapon${slot}`] = weapon;

        if (slot === "0") {
            this.leftWeapon = weapon;
            this.data.leftWeapon = weaponName;
        } else if (slot === "1") {
            this.rightWeapon = weapon;
            this.data.rightWeapon = weaponName;
        }
        if (this.mesh) {
            this.setWeaponMesh(slot, weapon);
        } else {
            this.onMeshReady = () => {
                this.onMeshReady = null;
                this.setWeaponMesh('0', this.leftWeapon);
                this.setWeaponMesh('1', this.rightWeapon);
            };
        }
    }
    setWeaponMesh(slot, weapon) {
        const weaponName = weapon?.name || weapon;
        if (slot > 1) return;
        slot === '0' ? this.leftWeaponBone.remove(this.leftWeaponBone.children[0]) : this.rightWeaponBone.remove(this.rightWeaponBone.children[0]);
        if (weapon) weapon.equip(slot);

        if (this.isRemote) return;
        MyEventEmitter.emit('weaponSwap', { weaponName, slot });
    }
    dropItem(item) {
        const { pos, dir } = this.getShootData();
        const dropPos = pos.add(dir.multiplyScalar(2));
        this.game.actorManager.spawnActor('card', { itemData: item, pos: dropPos }, false, true);
    }
    getAim() {
        const camPosition = this.camera.getWorldPosition(new THREE.Vector3());
        const camDirection = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
        const rot = this.camera.getWorldQuaternion(this.camQuat);
        /**@type {THREE.Vector3} */
        const bulletPosition = this.position.clone().add(new THREE.Vector3(0, .4, 0));
        const ray = new Ray(camPosition, camDirection);
        const result = this.game.physicsWorld.castRay(
            ray,
            100,
            false,
            undefined,
            undefined,
            undefined,
            this.body
        )
        let dir = camDirection;
        if (result) {
            const hitPos = camPosition.add(camDirection.clone().multiplyScalar(result.timeOfImpact));
            const tempDir = hitPos.sub(bulletPosition);
            tempDir.normalize();
            const dot = tempDir.dot(camDirection);
            if (dot > .5) {
                dir = tempDir;
                dir.normalize();
            }
        }
        return {
            pos: bulletPosition,
            dir,
            rot,
        }
    }
    getShootData() {
        const bulletPosition = this.position.clone().add(new THREE.Vector3(0, .7, 0));
        /**@type {THREE.Vector3} */
        const camDirection = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
        const rotation = this.camera.getWorldQuaternion(new THREE.Quaternion());
        const camPosition = this.camera.getWorldPosition(new THREE.Vector3());
        return {
            pos: bulletPosition,
            dir: camDirection,
            camPos: camPosition,
            rot: rotation,
        };
    }
    addEnergy(amnt) {
        if (this.energy) this.energy.add(amnt);
    }

    setDimmed(duration) {
        if (duration <= 0) return;
        this.dimmed = performance.now() + duration;
    }

    getDimmed() {
        return this.dimmed ? this.dimmed > performance.now() : false;
    }
    handleInput(dt, time) {
        if (!this.input) return;

        this.yaw = this.input.yaw;                    // Yaw
        this.cameraArm.rotation.x = this.input.pitch;       // Pitch

        this.rotation = this.camera.getWorldQuaternion(this.camQuat);

        const canExitState = this.stateManager.activeState.canExit();
        if (this.input.actionStates.attackLeft && this.input.pointerLocked) {
            if (canExitState && this.weapon0?.canUse()) {
                this.weapon0.use();
            }
        }
        if (this.input.actionStates.attackRight && this.input.pointerLocked) {
            if (canExitState && this.weapon1?.canUse()) {
                this.weapon1?.use();
            }
        }
        if (this.input.actionStates.spell1) {
            if (canExitState && this.weapon2?.canSpellUse()) {
                this.weapon2.spellUse();
                MyEventEmitter.emit('spellUsed', { slot: '2', cd: this.weapon2.cooldown });
            }
        }
        if (this.input.actionStates.spell2) {
            if (canExitState && this.weapon3?.canSpellUse()) {
                this.weapon3.spellUse();
                MyEventEmitter.emit('spellUsed', { slot: '3', cd: this.weapon3.cooldown });
            }
        }
        if (this.input.actionStates.spell3) {
            if (canExitState && this.weapon4?.canSpellUse()) {
                this.weapon4.spellUse();
                MyEventEmitter.emit('spellUsed', { slot: '4', cd: this.weapon4.cooldown });
            }
        }
        if (this.input.actionStates.spell4) {
            if (canExitState && this.weapon5?.canSpellUse()) {
                this.weapon5.spellUse();
                MyEventEmitter.emit('spellUsed', { slot: '5', cd: this.weapon5.cooldown });
            }
        }
        if (this.input.actionStates.blade) {
            this.tryEnterBlade();
        }
        if (this.input.keys['KeyF']) {
            if (!LocalData.flags.dev) return;
            const direction = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
            const scaledConvertedDirection = new THREE.Vector3(direction.x, direction.y, direction.z).multiplyScalar(2);
            this.position = this.position.add(scaledConvertedDirection);
            this.velocity = { x: 0, y: 0, z: 0 };
        }
        if (this.input.keys['Digit6']) {
            this.stateManager.tryEmote('rumbaDancing');
        }
        if (this.input.keys['Digit7']) {
            this.stateManager.tryEmote('twerk');
        }
    }

    getCameraDirection() {
        this.camera.getWorldDirection(this.tempVector);
        return this.tempVector;
    }
    setName(newName) {
        this.name = newName;
        this.namePlate?.setName(newName);
    }

    infoUpdate() {
        socket.on('playerInfoUpdate', (data) => {
            const { name, health, mana, money } = data;
            this.namePlate.infoUpdate({ name, health, mana, money });
        });
    }

    setParry(doesParry) {
        if (this.parry !== doesParry) {
            this.parry = doesParry;
            MyEventEmitter.emit('parryUpdate', this.parry);
        }
    }

    parried(attacker) {
        const pos = attacker?.position ?? attacker ?? new THREE.Vector3(0, 0, 0);
        this.game.soundPlayer.playPosSound('parry', this.position);
        this.animationManager?.changeTimeScale(0, 600);
        if (!this.isRemote) {
            this.stateManager.setState('parry', { pos });
        }
    }
    applyHit(data) {
        data = HitData.deserialize(data, (id) => this.game.getActorById(id));
        /**@type {HitData} */
        const { type, amount, stun, impulse, dim, sound } = data;
        this.game.soundPlayer.applyPosSound('playerHit', this.position);
        if (sound) {
            this.game.soundPlayer.applyPosSound(sound, this.pos);
        }
        if (this.isRemote) return;
        if (amount !== 0) {
            if (type === 'physical' || type === 'explosion') {
                CameraFX.shake(0.2, 125);
            }
            if (stun > 0) {
                this.stateManager.setState('stun', { stun, anim: 'knockback' });
            }
            if (impulse) {
                this.velocity = impulse;
            }
            if (dim) {
                this.setDimmed(dim);
            }
        }
    }
    healthChange(health) {
        super.healthChange(health);
        MyEventEmitter.emit('playerHealthChangeLocal', { id: this.id, health });
        if (!this.isRemote) {
            LocalData.health = health;
            MyEventEmitter.emit('playerHealthChange', { id: this.id, health });
        }
    }
    die(data) {
        if (this.isDead) return;
        if (this.isRemote) return;
        this.stateManager.setState('dead');
        MyEventEmitter.emit('iDied', data);
    }
    unDie() {
        if (this.isRemote) return;
        let spawnPoint = this.scene.getRespawnPoint();
        if (!spawnPoint) spawnPoint = { x: 0, y: 1, z: 0 };
        this.position = { x: spawnPoint.x, y: spawnPoint.y, z: spawnPoint.z };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.lastHitData = null;
        this.isDead = false;
        this.stateManager.setState('idle');

        MyEventEmitter.emit('actorHealthChangeLocal', this.health.maxHealth);
    }
    tryEnterBlade() {
        if (this.stateManager.currentStateName === 'blade') return;
        if (this.stateManager.currentStateName === 'dash') return;
        const neutral = this.movement.getInputDirection().length() === 0;
        if (!neutral && this.stateManager.setState('dash')) return;
        if (this.stateManager.setState('blade')) {
            return true;
        }
        return false;
    }
}