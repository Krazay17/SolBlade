import * as THREE from 'three';
import Player from '../player/Player.js';
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
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import PawnManager from '../core/PawnManager.ts';
import Actor from '../actors/Actor.ts';
import ItemManager from '../core/ItemManager.js';
import ProjectileManager from '../core/ProjectileManager.ts';
import Game from './Game.js';
import { Scene } from "three";
import Portal from '../actors/Portal.js';
import RAPIER from '@dimforge/rapier3d-compat';
import ActorManager from '../core/ActorManager.ts';
import QuestManager from '../core/QuestManager.js';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;


export default class GameScene {
  constructor(game, solWorld = 'world1', data = {}) {
    const {
      killFloor = -100,
    } = data;
    /**@type {Game} */
    this.game = game; // Access camera, renderer, input, etc.
    this.solWorld = solWorld;
    this.data = data;

    this.name = 'Level1';
    /** @type {Scene} */
    this.graphics = game.graphicsWorld;
    /**@type {RAPIER.World} */
    this.rapier = game.rapierWorld;
    Globals.scene = this;
  }
  onExit() {

  }
  onEnter() {
    LocalData.scene = this.name;
    this.levelLoaded = false;
    this.allGeoms = [];
    this.mergedLevel = null;
    this.mapLoaded = {};
    this.spawnPoints = [];
    this.scenePlayers = {};
    this.projectiles = [];

    /**@type {Actor[]} */
    this.actors = [];
    /**@type {Player[]} */
    this.players = [];

    this.meshManager = new MeshManager(this.game);
    this.itemManager = new ItemManager(this);
    this._pawnManager = new PawnManager(this);
    this.actorManager = new ActorManager(this);
    this.player = this._pawnManager.spawnPlayer({ pos: LocalData.position || new THREE.Vector3(0, 1, 0) }, false);
    this._pawnManager.setLocalPlayer(this.player);
    this.projectileManager = new ProjectileManager(this, this.player);
    this.debugData = new DebugData(this.player);
    this.partyFrame = new PartyFrame();

    Globals.player = this.player;
    this.players.push(this.player);

    this.questManager = new QuestManager(this, this.player);
    this.questManager.addQuest('quest1');

    this.spawnLevel(this.solWorld);
    soundPlayer.init();
    this.makeSky();
    setNetScene(this);
  }
  add(obj) {
    this.graphics.add(obj);
  }
  get pawnManager() { return this._pawnManager };
  getIsConnected() {
    return netSocket.connected;
  }
  getOtherActorMeshes() {
    return this.actorMeshes.filter(a => a !== this.player.meshBody);
  }
  getOtherActors() {
    return Object.values(this.scenePlayers).filter(p => p !== this.player);
  }
  addEnemy(actor) {
    this.enemyActors.push(actor);
  }
  getMapWalls() {
    return this.mapWalls;
  }
  getMergedLevel() {
    return this.mergedLevel || null;
  }
  getScenePlayersPos() {
    const pawns = [...this.pawnManager.players];
    const posMap = new Map();
    for (const p of pawns) {
      posMap.set(p.netId, p.position);
    }
    return posMap;
  }
  update(dt, time) {
    if (this.skyBox) this.skyBox.update();
    if (!this.levelLoaded) return;
    if (this.actorManager) this.actorManager.update(dt, time);
    if (this._pawnManager) { this._pawnManager.update(dt, time) }
    if (!this.player) return;
    if (!this.player.isDead) {
      if (this.player.body.position.y < this.data.killFloor ?? -100) {
        this.player.die('the void');
      }
    }
    this.debugData.update(dt, time);
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

    //this.game.graphicsWorld.fog = new THREE.FogExp2(0x000000, .002);
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
  createPointLight(pos, scale, color = 'white') {
    const light = new THREE.PointLight(color, scale.x * 10);
    light.position.copy(pos);
    this.graphics.add(light);
  }
  createPortal(pos, targetPos, newScene) {
    const portal = new Portal(this);
    portal.position.set(pos.x, pos.y, pos.z);
    portal.init(targetPos, newScene);
  }
  spawnLevel(name = 'world2') {
    if (this.mapLoaded[name]) return;
    this.game.loadingManager.gltfLoader.load(`/assets/${name}.glb`, (gltf) => {
      const model = gltf.scene;
      const itemLocations = [];
      const healthLocations = [];
      const energyLocations = [];
      const respawnLocations = [];
      const enemyLocations = [];
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1); // Adjust size if needed
      
      this.map = model;
      this.game.graphicsWorld.add(this.map);
      model.traverse((child) => {
        /**@type {string} */
        const childName = child.name;
        const userData = child.userData;
        if (childName.startsWith('Skip')) {
          child.visible = false;
          return;
        }
        if (childName.startsWith('itemLocation')) {
          child.visible = false;
          itemLocations.push(child.position);
          return;
        };
        if (childName.startsWith('healthLocation')) {
          child.visible = false;
          healthLocations.push(child.position);
          return;
        };
        if (childName.startsWith('energyLocation')) {
          child.visible = false;
          energyLocations.push(child.position);
          return;
        };
        if (childName.startsWith("SpawnEnemy")) {
          child.visible = false;
          enemyLocations.push(child.position);
          return;
        }
        if (childName.startsWith("SpawnPoint")) {
          child.visible = false;
          if (!this.spawnPoints) this.spawnPoints = [];
          this.spawnPoints.push(child.position.clone());
          return;
        }
        if (childName.startsWith('SpotLight')) {
          this.createSpotLight(child.position, child.rotation);
          return;
        }
        if (childName.startsWith('PointLight')) {
          this.createPointLight(child.position, child.scale, userData.color);
          return;
        }
        if (childName.startsWith('Portal')) {
          this.createPortal(
            child.position,
            { x: userData.pos[0], y: userData.pos[1], z: userData.pos[2] },
            userData.scene
          );
          return;
        }
        if (childName.startsWith('Landscape')) {
          child.material.map.repeat.set(40, 40);
        }
        if (childName.includes('Translucent')) {
          child.material.transparent = true;
          child.material.opacity = .2;
        }
        if (childName.startsWith('Visual')) return;
        // Collision and bvh
        if (child.isMesh) {
          // if(!child.geometry) return;
          // child.updateMatrix(); // ensure local matrix matches position/rotation/scale
          // child.geometry.applyMatrix4(child.matrix); // bake transform into geometry
          // child.position.set(0, 0, 0);
          // child.rotation.set(0, 0, 0);
          // child.scale.set(1, 1, 1);
          // child.updateMatrix();
          // if (!child.visible) child.visible = true;
          const geomClone = child.geometry.clone(); // clone for BVH
          geomClone.computeBoundsTree();

          // remove vertex colors only from the clone
          Object.keys(geomClone.attributes).forEach(a => {
            if (a.startsWith('color')) {
              geomClone.deleteAttribute(a);
            }
          });

          this.allGeoms.push(geomClone);
          child.castShadow = true;
          child.receiveShadow = true;

          const rBody = this.rapier.createCollider(triMeshFromVerts(child.geometry));
        }
      });
      for (const geom of this.allGeoms) {
        Object.keys(geom.attributes).forEach(a => {
          if (a.startsWith('color')) {
            geom.deleteAttribute(a);
          }
        })
      }
      const mergedGeom = mergeGeometries(this.allGeoms);
      mergedGeom.computeBoundsTree();
      this.mergedLevel = new THREE.Mesh(mergedGeom);

      // MyEventEmitter.emit('spawnLocations', {
      //   itemLocations,
      //   healthLocations,
      //   energyLocations,
      //   enemyLocations,
      // });

      this.levelLoaded = true;
      this.mapLoaded[name] = true;
      MyEventEmitter.emit('levelLoaded');
    });
  }
}

function triMeshFromVerts(geometry) {
  const vertices = geometry.attributes.position.array;
  let indices;

  if (geometry.index) {
    indices = geometry.index.array;
  } else {
    const count = vertices.length / 3;
    indices = new Uint16Array(count);
    for (let i = 0; i < count; i++) indices[i] = i;
  }
  const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
  colliderDesc.setFriction(0);
  colliderDesc.setRestitution(0);
  return colliderDesc;
}