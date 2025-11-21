import * as THREE from 'three';
import SkyBox from '../core/SkyBox.js';
import MyEventEmitter from '../../../_new/core/MyEventEmitter.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import Game from '../CGame.js';
import Portal from '../actors/CPortal.js';
import RAPIER from '@dimforge/rapier3d-compat';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export default class Scene {
  constructor(game, sceneName = 'scene1', data = {}) {
    const {
      killFloor = -30,
    } = data;
    /**@type {Game} */
    this.game = game; // Access camera, renderer, input, etc.
    this.sceneName = sceneName
    this.data = data;
  }
  get actorManager() { return this.game.actorManager };
  get player() { return this.game.player };
  get loadingManager() { return this.game.loadingManager };
  get graphics() { return this.game.graphicsWorld };
  get physics() { return this.game.physicsWorld };
  get questManager() { return this.game.questManager };
  get spawnPos() { return { x: 0, y: 1, z: 0 } };
  get soundPlayer() { return this.game.soundPlayer };
  onExit() {
    MyEventEmitter.emit('leaveScene', this.sceneName);
    this.destroy();
  }
  async onEnter(callback) {
    this.levelLoaded = false;
    this.allGeoms = [];
    this.mergedLevel = null;
    this.mapLoaded = {};
    this.spawnPoints = [];

    /**@type {THREE.Texture[]} */
    this.panningTextures = [];

    this.createSky();

    this.map = null;
    this.worldColliders = [];
    await this.spawnLevel(this.sceneName);
    if (this.game.meshManager.donePreLoad) {
      callback();
    } else {
      MyEventEmitter.once('donePreload', () => callback());
    }
    MyEventEmitter.emit('enterScene', this.sceneName);
  }
  destroy() {
    if (this.map) {
      this.graphics.remove(this.map)
      this.map = null;
    }
    if (this.worldColliders) {
      for (const c of this.worldColliders) {
        this.physics.removeCollider(c);
      }
      this.worldColliders = null;
    }
    if (this.skyBox) {
      this.skyBox.destroy();
      this.skyBox = null;
    }
  }
  add(obj) {
    this.graphics.add(obj);
  }
  remove(obj) {
    this.graphics.remove(obj);
  }
  getActorById(id) {
    return this.actorManager.getActorById(id)
  }
  getOtherActorMeshes() {
    return this.actorMeshes.filter(a => a !== this.player.meshBody);
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
    const pawns = [...this.actorManager.players];
    const posMap = new Map();
    for (const p of pawns) {
      posMap.set(p.id, p.position);
    }
    return posMap;
  }
  update(dt, time) {
    if (!this.levelLoaded) return;
    if (this.skyBox) this.skyBox.update();
    if (!this.player) return;
    if (!this.player.isDead) {
      if (this.player && (this.player.position.y < (this.data.killFloor || -100))) {
        MyEventEmitter.emit('iDied');
      }
    }
    if (this.panningTextures) {
      for (const tex of this.panningTextures) {
        tex.rotation += 2 * dt;
        tex.offset.add({ x: dt * .1, y: 0 });
      }
    }
  }

  getRespawnPoint() {
    if (this.spawnPoints && this.spawnPoints.length > 0) {
      const index = Math.floor(Math.random() * this.spawnPoints.length);
      return this.spawnPoints[index];
    }
  }
  createSky() {
    this.skyBox = new SkyBox(this);
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
  createPortal(pos, newWorld, targetPos) {
    const portal = new Portal(this.game);
    portal.position.set(pos.x, pos.y, pos.z);
    portal.init(newWorld, targetPos);
  }
  async spawnLevel(name = 'scene2', callback) {
    if (this.mapLoaded[name]) return;
    return new Promise((resolve, reject) => {
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
            //this.createPointLight(child.position, child.scale, userData.color);
            this.game.lightManager.spawnLight({ type: 'pointLight', pos: child.position, color: userData.color, intensity: child.scale.x * 10 });
            return;
          }
          if (childName.includes('PanningTex')) {
            this.panningTextures.push(child.material.map);
          }
          if (childName.startsWith('Landscape')) {
            child.material.map.repeat.set(40, 40);
          }
          if (userData.texRepeat) {
            //child.material = child.material.clone()
            child.material.map = child.material.map.clone();
            child.material.map.repeat.set(userData.texRepeat, userData.texRepeat);
            child.material.map.needsUpdate = true;
          }
          if (childName.includes('Translucent')) {
            child.material.transparent = true;
            child.material.opacity = .2;
          }
          if (childName.includes('Alpha')) {
            child.material.transparent = true;
            child.material.opacity = 6;
            //child.material.depthWrite = false;
            child.renderOrder = 1;
          }
          if (childName.startsWith('Visual')) return;
          if (childName.startsWith('Portal')) {
            const pos = userData.pos ? { x: userData.pos[0], y: userData.pos[1], z: userData.pos[2] } : undefined
            this.createPortal(
              child.position,
              userData.world,
              pos
            );
            return;
          }
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

            // const rBody = this.physics.createCollider(triMeshFromVerts(geomClone));
            // this.worldColliders.push(rBody);

            const edges = new THREE.EdgesGeometry(child.geometry, 35);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
            child.add(line);
            child.material.dithering = true;

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

        const rBody = this.physics.createCollider(triMeshFromVerts(mergedGeom));
        this.worldColliders.push(rBody);

        // MyEventEmitter.emit('spawnLocations', {
        //   itemLocations,
        //   healthLocations,
        //   energyLocations,
        //   enemyLocations,
        // });

        this.levelLoaded = true;
        this.mapLoaded[name] = true;
        MyEventEmitter.emit('levelLoaded');
        resolve(gltf);
      }, undefined, reject)

    })
  }
}

function triMeshFromVerts(geometry) {
  // Ensure the geometry is up-to-date
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  // Clone vertex and index arrays so Rapier gets unique, safe buffers
  const vertices = new Float32Array(geometry.attributes.position.array);
  let indices;

  if (geometry.index) {
    indices = new Uint32Array(geometry.index.array);
  } else {
    const count = vertices.length / 3;
    indices = new Uint32Array(count);
    for (let i = 0; i < count; i++) indices[i] = i;
  }

  // Create the collider safely
  const colliderDesc = RAPIER.ColliderDesc.trimesh(vertices, indices);
  colliderDesc.setFriction(0);
  colliderDesc.setRestitution(0);
  return colliderDesc;
}
