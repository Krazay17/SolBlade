import * as THREE from 'three';
import LocalData from '../core/LocalData';
import MyEventEmitter from '../core/MyEventEmitter';
import * as Weapon from './weapons/index';
import { netSocket, tryUpdatePosition } from '../core/NetManager';
import CameraFX from '../core/CameraFX';
import PlayerMovement from './PlayerMovement';
import DevMenu from '../ui/DevMenu';
import NamePlate from '../core/Nameplate';
import Pawn from '../actors/Pawn';
import PlayerStateManager from './playerStates/PlayerStateManager';
import HitData from '../core/HitData';
import { menuButton } from '../ui/Menu';
import EnergyManager from '../core/EnergyManager';
import Game from '../Game';

export default class Player extends Pawn {
    constructor(game, data = {}, input, camera) {
        if (!data.isRemote) {
            data.type = 'player';
            data.health = LocalData.health;
            data.name = LocalData.name;
        }
        super(game, data);
        this.tick = true;

        this.world = game.world;
        this.parry = false;
        this.dimmed = 0;
        this.crownMesh = null;

        this.dashCost = 25;
        this.doubleJumpCost = 40;

        // Local Player setup
        if (!this.isRemote) {
            this.tick = false
            this.input = this.game.input;
            this.camera = this.game.camera;

            this.direction = new THREE.Vector3();
            this.tempVector = new THREE.Vector3();
            this.energy = new EnergyManager(this, 100);
            this.movement = new PlayerMovement(this.game, this);
            this.stateManager = new PlayerStateManager(this.game, this);
            this.devMenu = new DevMenu(this, this.movement);

            /**@type {Weapon.Weapon} */
            this.weapon0 = new Weapon.WeaponScythe(game, this, '0');
            /**@type {Weapon.Weapon} */
            this.weapon1 = new Weapon.WeaponSword(game, this, '1');
            /**@type {Weapon.Weapon} */
            this.weapon2 = null;
            /**@type {Weapon.Weapon} */
            this.weapon3 = null;
            /**@type {Weapon.Weapon} */
            this.weapon4 = null;
            /**@type {Weapon.Weapon} */
            this.weapon5 = null;

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


            MyEventEmitter.on('KeyPressed', (key) => {
                if (key === 'KeyH') {
                    this.die('the void');
                }
            });

        } else {
            // Remote Player

            this.namePlate = new NamePlate(this, this.height);
            // !!!!pre load crown for net player!!!!
            if (this.data.hasCrown) {
                this.pickupCrown();
            }
        }
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
    setWorld(newWorld) {
        this.world = newWorld;
        this.solWorld = this.world.solWorld;
        this.body.velocity = { x: 0, y: 0, z: 0 };
    }
    worldReady() {
        if (this.lastWorld !== this.solWorld) {
            this.lastWorld = this.solWorld;
            if (this.portalPos) {
                this.body.position = this.portalPos;
                this.portalPos = null;
            } else {
                this.body.position = this.world.spawnPos;
            }
        }
        if (this.body) {
            this.body.wakeUp();
        }
        this.tick = true;

    }
    async assignMesh(skin) {
        if (await super.assignMesh(skin)) {
            if (this.isRemote) return;
            //MyEventEmitter.emit('playerStateUpdate', this);
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
        const weaponName = weapon?.name || null;
        switch (weaponName) {
            case 'Fireball':
                weapon = new Weapon.WeaponFireball(this.game, this, slot);
                break;
            case 'Pistol':
                weapon = new Weapon.WeaponPistol(this.game, this, slot);
                break;
            case 'Sword':
                weapon = new Weapon.WeaponSword(this.game, this, slot);
                break;
            case 'Scythe':
                weapon = new Weapon.WeaponScythe(this.game, this, slot);
                break;
            default:
                weapon = null;
                break;
        }
        if (!weapon) {
            this[`weapon${slot}`] = null;
            return;
        }
        this[`weapon${slot}`] = weapon;
    }
    dropItem(item) {
        const { pos, dir } = this.getShootData();
        const dropPos = pos.add(dir.multiplyScalar(2));
        this.game.actorManager.spawnActor('item', { item, pos: dropPos }, false, true);
    }
    getShootData() {
        const bulletPosition = this.position.clone().add(new THREE.Vector3(0, .7, 0));
        /**@type {THREE.Vector3} */
        const bulletDirection = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
        const rotation = this.camera.getWorldQuaternion(new THREE.Quaternion());
        const camPosition = this.camera.getWorldPosition(new THREE.Vector3());
        return {
            pos: bulletPosition,
            dir: bulletDirection,
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

    update(dt, time) {
        if (!this.tick) return;
        super.update(dt, time);
        // Local Player
        if (!this.isRemote) {
            if (this.energy) this.energy.update(dt);
            this.handleInput(dt, time);
            tryUpdatePosition({ pos: this.position, rot: this.rotationY });
            LocalData.position = this.position;
            CameraFX.update(dt);
        }
    }
    handleInput(dt, time) {
        if (!this.input) return;

        this.quatY = this.input.yaw;                    // Yaw
        this.cameraArm.rotation.x = this.input.pitch;       // Pitch

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
        if (this.input.actionStates.goHome) {
            this.game?.setWorld('world1');
        }
        if (this.input.keys['KeyF']) {
            if (!LocalData.flags.dev) return;
            const direction = this.camera.getWorldDirection(new THREE.Vector3()).normalize();
            const scaledConvertedDirection = new THREE.Vector3(direction.x, direction.y, direction.z).multiplyScalar(2);
            this.body.position = this.body.position.add(scaledConvertedDirection);
            this.body.velocity = { x: 0, y: 0, z: 0 };
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

    getInputDirection(z = 0) {
        this.direction.set(0, 0, 0);

        // Gather input directions
        if (this.input.keys['KeyW']) this.direction.z -= 1;
        if (this.input.keys['KeyS']) this.direction.z += 1;
        if (this.input.keys['KeyA']) this.direction.x -= 1;
        if (this.input.keys['KeyD']) this.direction.x += 1;

        if (this.direction.length() === 0) {
            this.direction.z = z;
        }

        const { rotatedX, rotatedZ } = this.rotateInputVector(this.direction);

        // Input direction as a vector
        this.direction.set(rotatedX, 0, rotatedZ);
        this.direction.normalize();
        return this.direction;
    }

    rotateInputVector(dir) {
        // Rotate input direction by controller yaw
        const yaw = this.input.yaw;
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);

        const rotatedX = dir.x * cosYaw + dir.z * sinYaw;
        const rotatedZ = -dir.x * sinYaw + dir.z * cosYaw;

        return { rotatedX, rotatedZ };
    }

    setName(newName) {
        this.name = newName;
        this.namePlate?.setName(newName);
        console.log(this.name);
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

    hit(data) {
        super.hit(data);
    }
    applyHit(data) {
        super.applyHit(data);
        /**@type {HitData} */
        const { type, amount, stun, impulse, dim } = data;
        //this.game.soundPlayer.applyPosSound('playerHit', this.position);
        if (this.isRemote) return;
        if (amount !== 0) {
            if (type === 'physical' || type === 'explosion') {
                CameraFX.shake(0.2, 125);
            }
            if (stun > 0) {
                this.stateManager.setState('stun', { stun, anim: 'knockback' });
            }
            if (impulse) {
                this.body.wakeUp();
                this.body.velocity = impulse;
            }
            if (dim) {
                this.setDimmed(dim);
            }
        }
    }
    healthChange(health) {
        super.healthChange(health);
        MyEventEmitter.emit('playerHealthChangeLocal', { id: this.netId, health });
        if (!this.isRemote) {
            LocalData.health = health;
            MyEventEmitter.emit('playerHealthChange', { id: this.netId, health });
        }
    }
    // only local
    die() {
        if (this.isRemote) return;
        if (this.isDead) return;
        this.stateManager.setState('dead');
        MyEventEmitter.emit('iDied', this.lastHitData);
    }
    applyDie() {
        this.die();
    }
    // only local
    unDie() {
        if (this.isRemote) return;
        let spawnPoint = this.world.getRespawnPoint();
        if (!spawnPoint) spawnPoint = { x: 0, y: 1, z: 0 };
        this.body.position = { x: spawnPoint.x, y: spawnPoint.y, z: spawnPoint.z };
        this.body.velocity = { x: 0, y: 0, z: 0 };
        this.position.copy(this.body.position);
        this.lastHitData = null;
        this.health = this.maxHealth;
        this.isDead = false;
        this.stateManager.setState('idle');

        //MyEventEmitter.emit('playerRespawn');
        MyEventEmitter.emit('actorHealthChangeLocal', this.health);
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