import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import SceneBase from './_SceneBase.js';
import Player from '../player/Player.js';
import { getMaterial } from '../core/MaterialManager.js';
import { netSocket, setNetScene } from '../core/NetManager.js';
import LocalData from '../core/LocalData.js';
import Globals from '../utils/Globals.js';
import SkyBox from '../actors/SkyBox.js';
import soundPlayer from '../core/SoundPlayer.js';
import DebugData from '../ui/DebugData.js';
import MeshManager from '../core/MeshManager.js';
import MyEventEmitter from '../core/MyEventEmitter.js';
import PartyFrame from '../ui/PartyFrame.js';
import GameMode from '../core/GameMode.js';
import voiceChat from '../core/VoiceChat.js';
import { MeshBVH, MeshBVHHelper, acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import ProjectileFireball from '../actors/ProjectileFireball.js';
import ItemPickup from '../actors/ItemPickup.js';
import PowerPickup from '../actors/PowerPickup.js';
import CrownPickup from '../actors/CrownPickup.js';
import PawnManager from '../core/PawnManager.ts';
import Actor from '../actors/Actor.ts';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;


export default class GameScene extends SceneBase {
  onEnter() {
    this.name = 'level1';
    this.levelLoaded = false;
    this.spawnPoints = [];
    this.scenePlayers = {};
    this.projectiles = [];

    /**@type {Actor[]} */
    this.actors = [];

    /**@type {Player[]} */
    this.players = [];

    this.meshManager = new MeshManager(this.game);
    this.actorMeshes = [];
    this.pickupActors = [];
    this.mapWalls = [];
    this.mergedLevel = null;
    this.enemyActors = [];
    this.enemyMeshes = [];
    this.enemyMeshMap = new Map();
    Globals.enemyActors = this.enemyActors;

    this.spawnLevel();

    this.pawnManager = new PawnManager(this);
    this.player = this.pawnManager.spawnPlayer(LocalData.position || new THREE.Vector3(0, 1, 0));
    this.pawnManager.setPlayer(this.player);
    //const enemy = this.pawnManager.spawnEnemy('LavaGolem', new THREE.Vector3(0, 13, 141));
    // const julians = 1;
    // for (let i = 0; i < julians; i++) {
    //   this.pawnManager.spawnEnemy('julian', new THREE.Vector3(0, 16, 147 + i))
    // }

    Globals.player = this.player;
    this.players.push(this.player);

    this.partyFrame = new PartyFrame();

    soundPlayer.loadMusic('music1', 'assets/Music1.mp3');
    function playMusiconFirstClick() {
      soundPlayer.playMusic(0);
      document.removeEventListener('mousedown', playMusiconFirstClick);
      soundPlayer.loadAllMusic();
    }
    document.addEventListener('mousedown', playMusiconFirstClick);

    this.debugData = new DebugData(this.player);

    this.makeSky();
    setNetScene(this, {
      scene: this.name,
      pos: LocalData.position,
      name: LocalData.name,
      money: LocalData.money,
      health: LocalData.health,
    });

    this.gameMode = new GameMode(this, 'crown', this.player);
    voiceChat.setScene(this);

    this.initListeners();
  }
  initListeners() {
    MyEventEmitter.on('playerDropItem', ({ item, pos }) => {
      if (netSocket.connected) return;
      this.spawnPickup('item', pos, null, item);
    })
  }
  getPawnManager() { return this.pawnManager };
  /**@param {Actor} actor */
  addActor(actor) {
    this.actors.push(actor);
  }
  removeActor(actor) {
    this.actors.splice(this.actors.indexOf(actor), 1);
  }
  getActors() { return this.actors; }
  spawnProjectile(player, data) {
    const { type, netId, pos, dir, speed, dur } = data;
    let projectile;
    switch (type) {
      case 'Fireball':
        projectile = new ProjectileFireball({ pos, dir, speed, dur }, { isRemote: true, netId });
        break;
    }
    this.projectiles.push(projectile);
    return projectile;
  }
  moveProjectile(data) {
    const { netId, pos } = data;
    const projectile = this.projectiles.find(p => p.netId === netId);
    if (!projectile) return;
    projectile.setTargetPos(pos);
  }
  removeProjectile(data) {
    const id = data;
    const projectile = this.projectiles.find(p => p.netId === id);
    if (!projectile) return;
    projectile.destroy();
  }
  getIsConnected() {
    return netSocket.connected;
  }
  getOtherActorMeshes() {
    return this.actorMeshes.filter(a => a !== this.player.meshBody);
  }
  getOtherActors() {
    return Object.values(this.scenePlayers).filter(p => p !== this.player);
  }
  getEnemyMeshMap() {
    return this.enemyMeshMap;
  }
  addEnemy(actor) {
    this.enemyActors.push(actor);
  }
  addEnemyMesh(mesh) {
    this.enemyMeshes.push(mesh);
  }
  getEnemyMeshes() {
    return this.enemyMeshes;
  }
  getEnemiesInRange(position, range) {
    const enemiesInRange = new Map();
    for (const enemy of this.enemyActors) {
      const dist = enemy.position.distanceTo(position);
      if (dist <= range) {
        enemiesInRange.set(enemy, dist);
      }
    }
    return enemiesInRange;
  }
  getMapWalls() {
    return this.mapWalls;
  }
  getMergedLevel() {
    return this.mergedLevel || null;
  }
  getScenePlayersPos() {
    const positions = {};
    Object.values(this.scenePlayers).forEach(player => {
      positions[player.netId] = player.position;
    });
    return positions;
  }
  update(dt, time) {
    if (this.skyBox) this.skyBox.update();
    if (!this.levelLoaded) return;
    for (const a of this.actors) { a.update(dt, time); }
    if (this.pawnManager) {
      this.pawnManager.update(dt, time);
    }
    if (!this.player) return;
    // KillFloor
    if (this.player.body.position.y < -25 && !this.player.isDead) {
      this.player.die('the void');
    }
    // Look for pickups
    if (!this.player.isDead) {
      if (this.pickupActors.length > 0) {
        const playerPos = this.player.body.position;
        const pickupRadius = 1.75;
        this.pickupActors.forEach(pickup => {
          const dist = playerPos.distanceTo(pickup.position);
          if (dist < pickupRadius) {
            pickup.onCollect(this.player);
          }
        });
      }
    }
    this.debugData.update(dt, time);
  }
  spawnPickup(type, position, itemId, itemData) {
    let pickup;
    const pos = new THREE.Vector3(position.x, position.y, position.z)
    switch (type) {
      case 'item':
        pickup = new ItemPickup(this, pos, itemId, itemData);
        break;
      case 'crown':
        pickup = new CrownPickup(this, pos, itemId);
        break;
      default:
        pickup = this.getPickup(itemId) ?? new PowerPickup(this, type, pos, itemId);
        break;
    }
    this.game.graphicsWorld.add(pickup);
    this.pickupActors.push(pickup);
  }
  getPickup(itemId) {
    return this.pickupActors.find(p => p.itemId === itemId);
  }

  removePickup(item, itemId) {
    const pickup = item ? item : this.pickupActors.find(p => p.itemId === itemId);
    if (pickup) {
      this.game.graphicsWorld.remove(pickup);
      this.pickupActors.splice(this.pickupActors.indexOf(pickup), 1);
    }
  }

  getRespawnPoint() {
    if (this.spawnPoints && this.spawnPoints.length > 0) {
      const index = Math.floor(Math.random() * this.spawnPoints.length);
      return this.spawnPoints[index];
    }
  }

  makeSky() {
    this.skyBox = new SkyBox();
    this.game.graphicsWorld.add(this.skyBox);

    //this.game.graphicsWorld.fog = new THREE.Fog(0xcc2211, -3000, 5000);
  }

  addPlayer(id, data) {
    console.log('Adding player', id, data);
    if (this.scenePlayers[id]) return this.scenePlayers[id];
    //const player = new Player(this, data.pos, true, id, data);
    const player = this.pawnManager.spawnPlayer(data.pos, true, id, data)
    this.scenePlayers[id] = player;
    this.enemyActors.push(player);
    this.players.push(player);
    MyEventEmitter.emit('playerJoined', player);
    return player;
  }

  removePlayer(id) {
    const player = this.scenePlayers[id];
    if (player) {
      MyEventEmitter.emit('playerLeft', player);
      this.enemyActors.splice(this.enemyActors.indexOf(player), 1);
      this.enemyMeshes.splice(this.enemyMeshes.indexOf(player.getMeshBody()), 1);
      this.players.splice(this.players.indexOf(player), 1);
      player.destroy(id);
      delete this.scenePlayers[id];
    }
  }

  fullNetSync() {
    if (!this.player) return null;
    return {
      scene: this.name,
      pos: this.player.body.position,
      rot: this.player.rotation,
      state: this.player.getState(),
      health: this.player.health,
      name: LocalData.name,
      money: LocalData.money,
    };
  }
  createSpotLight(pos, rot) {
    const targetDir = new THREE.Vector3().setFromEuler(rot);
    const light = new THREE.SpotLight(0xffffff, 100, 40);
    light.castShadow = true;
    light.position.copy(pos);

    const target = new THREE.Object3D();
    target.position.copy(pos.add(targetDir));
    light.target = target;
    this.graphics.add(light);
    this.graphics.add(target);
  }
  createPointLight(pos, scale) {
    console.log(scale);
    const light = new THREE.PointLight(0xffff00, scale.x * 10);
    light.position.copy(pos);
    this.graphics.add(light);
  }
  spawnLevel() {
    this.game.loadingManager.gltfLoader.load('/assets/Level1.glb', (gltf) => {
      const model = gltf.scene;
      const allGeoms = [];
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1); // Adjust size if needed
      this.game.graphicsWorld.add(model);
      model.traverse((child) => {
        /**@type {string} */
        const childName = child.name;
        if (childName.startsWith("SpawnPoint")) {
          child.visible = false;
          if (!this.spawnPoints) this.spawnPoints = [];
          this.spawnPoints.push(child.position.clone());
          return;
        }
        if (childName.startsWith('Visual')) return;
        if (childName.startsWith('SpotLight')) {
          this.createSpotLight(child.position, child.rotation);
          return;
        }
        if (childName.startsWith('PointLight')) {
          this.createPointLight(child.position, child.scale);
          return;
        }
        if (child.isMesh) {
          const geomClone = child.geometry.clone(); // clone for BVH
          geomClone.computeBoundsTree();

          // remove vertex colors only from the clone
          Object.keys(geomClone.attributes).forEach(a => {
            if (a.startsWith('color')) {
              geomClone.deleteAttribute(a);
            }
          });

          allGeoms.push(geomClone);
          child.castShadow = true;
          child.receiveShadow = true;
          this.mapWalls.push(child);

          let shape;
          try {
            shape = createTrimesh(child.geometry);
          } catch (e) {
            console.warn('Could not create trimesh for', child);
            return;
          }
          const body = new CANNON.Body({
            mass: 0, // static
            shape: shape,
            material: getMaterial('defaultMaterial'),
            collisionFilterGroup: 1,
            collisionFilterMask: 2,
          });
          body.position.copy(child.getWorldPosition(new THREE.Vector3()));
          body.quaternion.copy(child.getWorldQuaternion(new THREE.Quaternion()));
          this.game.physicsWorld.addBody(body);

        }
      });
      for (const geom of allGeoms) {
        Object.keys(geom.attributes).forEach(a => {
          if (a.startsWith('color')) {
            geom.deleteAttribute(a);
          }
        })
      }
      const mergedGeom = mergeGeometries(allGeoms);
      mergedGeom.computeBoundsTree();
      this.mergedLevel = new THREE.Mesh(mergedGeom)
      // const bvhHelper = new MeshBVHHelper(this.mergedLevel);
      // Globals.graphicsWorld.add(bvhHelper);

      this.levelLoaded = true;
      MyEventEmitter.emit('levelLoaded');
    });
  }
}


// Helper: Convert Three.js geometry to Cannon Trimesh
function createTrimesh(geometry) {
  const vertices = geometry.attributes.position.array;
  let indices;

  if (geometry.index) {
    // If the geometry already has an index buffer
    indices = geometry.index.array;
  } else {
    let indices = [];
    for (let i = 0; i < vertices.length / 3; i++) {
      indices.push(i);
    }
    indices = new Uint16Array(indices);
  }

  return new CANNON.Trimesh(vertices, indices);
}

// Helper: Convert Three.js geometry to Cannon ConvexPolyhedron
function createConvexHull(geometry) {
  const position = geometry.attributes.position;
  const vertices = [];
  for (let i = 0; i < position.count; i++) {
    vertices.push(new CANNON.Vec3(
      position.getX(i),
      position.getY(i),
      position.getZ(i)
    ));
  }

  // Faces: each face is an array of vertex indices
  let faces = [];
  if (geometry.index) {
    const indices = geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      faces.push([indices[i], indices[i + 1], indices[i + 2]]);
    }
  } else {
    for (let i = 0; i < vertices.length; i += 3) {
      faces.push([i, i + 1, i + 2]);
    }
  }

  return new CANNON.ConvexPolyhedron({ vertices, faces });
}