import * as THREE from 'three';
import * as CANNON from 'cannon';
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
import Pickup from '../actors/Pickup.js';
import voiceChat from '../core/VoiceChat.js';
import { MeshBVH, MeshBVHHelper, acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import PFireball from '../actors/PFireball.js';
import ItemPickup from '../actors/ItemPickup.js';
import PowerPickup from '../actors/PowerPickup.js';
import CrownPickup from '../actors/CrownPickup.js';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export default class GameScene extends SceneBase {
  onEnter() {
    this.name = 'level1';
    this.tickables = [];
    this.levelLoaded = false;
    this.spawnPoints = [];
    this.scenePlayers = {};
    this.projectiles = [];

    this.meshManager = new MeshManager(this.game);
    this.actorMeshes = [];
    this.pickupActors = [];
    this.mapWalls = [];
    this.mergedLevel = null;
    this.enemyActors = [];
    this.spawnLevel();

    this.player = new Player(this.game, this, LocalData.position || new THREE.Vector3(0, 1, 0), false, this.game.camera);
    Globals.player = this.player;

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
  addTickable(tickable) {
    this.tickables.push(tickable);
  }

  removeTickable(tickable) {
    const index = this.tickables.indexOf(tickable);
    if (index !== -1) {
      this.tickables.splice(index, 1);
    }
  }

  spawnProjectile(player, data) {
    const { type, netId, pos, dir, speed, dur } = data
    console.log('spawnProjectile')
    let projectile;
    switch (type) {
      case 'Fireball':
        projectile = new PFireball({ pos, dir, speed, dur }, { isRemote: true, netId });
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
    this.tickables.forEach(t => t.update(dt, time));
    if (this.player && this.levelLoaded) {
      this.player.update(dt, time);

      // KillFloor
      if (this.player.body.position.y < -10 && !this.player.isDead) {
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
    }
    if (this.scenePlayers) {
      Object.values(this.scenePlayers).forEach(player => {
        player.update(dt, time);
      });
    }
    if (this.skyBox) this.skyBox.update();
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
        pickup = this.getPickup(itemId) ? this.getPickup(itemId)
          : new PowerPickup(this, type, pos, itemId);
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
  }

  addPlayer(id, data) {
    console.log('Adding player', id, data);
    if (this.scenePlayers[id]) return this.scenePlayers[id];
    const player = new Player(this.game, this, data.pos, true, null, id, data);
    this.scenePlayers[id] = player;
    this.enemyActors.push(player);
    Globals.enemyActors = this.enemyActors;
    MyEventEmitter.emit('playerJoined', player);
    return player;
  }

  removePlayer(id) {
    const player = this.scenePlayers[id];
    if (player) {
      MyEventEmitter.emit('playerLeft', player);
      this.enemyActors.splice(this.enemyActors.indexOf(player), 1);
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

  spawnLevel() {
    this.game.glbLoader.load('/assets/Level1.glb', (gltf) => {
      const model = gltf.scene;
      const allGeoms = [];
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1); // Adjust size if needed
      this.game.graphicsWorld.add(model);
      model.traverse((child) => {
        if (child.name.startsWith("SpawnPoint")) {
          child.visible = false;
          if (!this.spawnPoints) this.spawnPoints = [];
          this.spawnPoints.push(child.position.clone());
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
            collisionFilterMask: -1,
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

    // Loading progress bar could be added here using the onProgress callback
    this.game.glbLoader.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      // console.log(`Loading file: ${url}`);
      const progress = (itemsLoaded / itemsTotal) * 100;
      this.loadingBar(progress.toFixed(2));
    };
    this.game.glbLoader.manager.onLoad = () => {
      this.loadingBar(100);
    };

  }

  loadingBar(progress) {
    if (!this.loadingBarContainer) {
      this.loadingBarContainer = document.createElement('div');
      this.loadingBarContainer.id = 'loadingBarContainer';
      this.loadingBarContainer.style.position = 'absolute';
      this.loadingBarContainer.style.top = '10%';
      this.loadingBarContainer.style.left = '50%';
      this.loadingBarContainer.style.transform = 'translate(-50%, -50%)';
      this.loadingBarContainer.style.width = '50%';
      this.loadingBarContainer.style.height = '30px';
      this.loadingBarContainer.style.backgroundColor = '#555';
      this.loadingBarContainer.style.border = '2px solid #000';
      document.body.appendChild(this.loadingBarContainer);
    }

    if (!this.loadingBarFill) {
      this.loadingBarFill = document.createElement('div');
      this.loadingBarFill.id = 'loadingBar';
      this.loadingBarFill.style.backgroundColor = '#0f0';
      this.loadingBarContainer.appendChild(this.loadingBarFill);
      this.loadingBarFill.style.height = '100%';
      this.loadingBarFill.style.width = '0%';
      this.loadingBarFill.style.zIndex = '1000';
    }
    this.loadingBarFill.style.width = `${progress}%`;
    if (progress >= 95) {
      setTimeout(() => {
        if (this.loadingBarContainer) {
          document.body.removeChild(this.loadingBarContainer);
          this.loadingBarContainer = null;
          this.loadingBarFill = null;
        }
      }, 500); // wait a bit before removing
    }

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