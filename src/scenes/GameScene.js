import * as THREE from 'three';
import * as CANNON from 'cannon';
import SceneBase from './_SceneBase.js';
import Player from '../player/Player.js';
import { GLTFLoader, SkeletonUtils } from 'three/examples/jsm/Addons.js';
import { getMaterial } from '../core/MaterialManager.js';
import { setNetScene } from '../core/NetManager.js';
import LocalData from '../core/LocalData.js';
import setupChat from '../ui/Chat.js';
import Globals from '../utils/Globals.js';
import SkyBox from '../actors/SkyBox.js';
import soundPlayer from '../core/SoundPlayer.js';
import DebugData from '../ui/DebugData.js';
import PartyFrame from '../ui/PartyFrame.js';
import MeshManager from '../core/MeshManager.js';
import Crosshair from '../ui/Crosshair.js';
import CameraFX from '../core/CameraFX.js';

export default class GameScene extends SceneBase {
  onEnter() {
    this.name = 'level1';
    this.spawnLevel();
    this.netPlayers = {};
    let playerPosBuffer = LocalData.position;
    playerPosBuffer.y += 2; //start a bit above ground

    this.meshManager = new MeshManager();
    this.actorMeshes = [];
    this.crosshair = new Crosshair(this.game.graphicsWorld);

    this.player = new Player(this.game, this, playerPosBuffer, true, this.game.camera);
    Globals.player = this.player;

    soundPlayer.loadMusic('music1', 'assets/Music1.mp3');
    function playMusiconFirstClick() {
      soundPlayer.playMusic(0);
      document.removeEventListener('mousedown', playMusiconFirstClick);
      soundPlayer.loadAllMusic();
    }
    document.addEventListener('mousedown', playMusiconFirstClick);

    this.debugData = new DebugData(this.player);
    this.partyFrame = new PartyFrame(this.player);

    this.makeSky();
    setNetScene(this, {
      scene: this.name,
      pos: LocalData.position,
      name: LocalData.name,
      money: LocalData.money,
      health: LocalData.health,
    });
    setupChat();
  }

  update(dt, time) {
    if (this.player && this.levelLoaded) {
      this.player.update(dt, time);

      // KillFloor
      if (this.player.body.position.y < -100) {
        this.player.body.position.set(0, 5, 0);
        this.player.body.velocity.set(0, 0, 0);
      }
    }
    if (this.netPlayers) {
      Object.values(this.netPlayers).forEach(player => {
        player.update(dt, time);
      });
    }
    if (this.skyBox) this.skyBox.update();
    this.debugData.update(dt, time);
  }

  makeSky() {
    this.skyBox = new SkyBox();
    this.game.graphicsWorld.add(this.skyBox);
    // const skyGeo = new THREE.SphereGeometry(2500, 25, 25);
    // const myTexture = new THREE.TextureLoader().load('assets/RedSky0.webp');
    // const myMaterial = new THREE.MeshBasicMaterial({
    //   map: myTexture,
    //   side: THREE.BackSide
    // });
    // const sky = new THREE.Mesh(skyGeo, myMaterial);
    // this.game.graphicsWorld.add(sky);
  }

  makeFloor() {
    //make a cannon floor plane
    const groundBody = new CANNON.Body({
      position: new CANNON.Vec3(0, 1, 0),
      quaternion: new CANNON.Quaternion().setFromEuler(-Math.PI / 2, 0, 0),
      mass: 0, // mass == 0 makes the body static
      shape: new CANNON.Plane(),
      material: getMaterial('defaultMaterial'),
    });
    this.game.physicsWorld.addBody(groundBody);
  }

  addPlayer(id, data) {
    const player = new Player(this.game, this, data.pos, false, null, id);
    this.netPlayers[id] = player;
    player.name = data.name;
    player.currentAnimState = data.state;
    this.partyFrame.addPlayer(player);
    return player;
  }

  removePlayer(id) {
    const player = this.netPlayers[id];
    if (player) {
      this.partyFrame.removePlayer(player);
      player.destroy(id);
      delete this.netPlayers[id];
    }
  }

  fullNetSync() {
    if (!this.player) return null;
    return {
      scene: this.name,
      pos: this.player.body.position,
      rot: this.player.rotation,
      state: this.player.getState(),
      name: LocalData.name,
      money: LocalData.money,
    };
  }

  spawnLevel() {
    // Load a test world mesh
    const loader = new GLTFLoader();
    loader.load('/assets/Level2.glb', (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1); // Adjust size if needed
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.game.graphicsWorld.add(model);

      // Create a static physics body for the level
      gltf.scene.traverse((child) => {
        if (child.isMesh) {
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
      this.levelLoaded = true;
      console.log('Level loaded');
    });
  }
}
// Helper: Convert Three.js geometry to Cannon Trimesh
function createTrimesh(geometry) {
  const vertices = geometry.attributes.position.array;
  let indices = [];

  if (geometry.index) {
    // If the geometry already has an index buffer
    indices = Array.from(geometry.index.array);
  } else {
    // No index buffer → assume each consecutive 3 vertices is a triangle
    for (let i = 0; i < vertices.length / 3; i++) {
      indices.push(i);
    }
  }

  return new CANNON.Trimesh(vertices, indices);
}