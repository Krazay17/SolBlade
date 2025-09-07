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
import MyEventEmitter from '../core/MyEventEmitter.js';

export default class GameScene extends SceneBase {
  onEnter() {
    this.name = 'level1';
    this.glbLoader = new GLTFLoader();
    this.spawnLevel();
    this.netPlayers = {};
    let playerPosBuffer = LocalData.position;
    playerPosBuffer.y += 0.1; //start a bit above ground

    this.meshManager = new MeshManager();
    this.actorMeshes = [];
    this.mapWalls = [];
    this.crosshair = new Crosshair(this.game.graphicsWorld);

    this.player = new Player(this.game, this, playerPosBuffer, false, this.game.camera);
    Globals.player = this.player;


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
    setupChat();
  }

  update(dt, time) {
    if (this.player && this.levelLoaded) {
      this.player.update(dt, time);

      // KillFloor
      if (this.player.body.position.y < -100) {
        this.player.die();
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

  getRespawnPoint() {
    return new THREE.Vector3(0, 1, 0);
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
    const player = new Player(this.game, this, data.pos, true, null, id, data);
    this.netPlayers[id] = player;
    player.name = data.name;
    player.currentAnimState = data.state;
    MyEventEmitter.emit('addPartyMember', player);
    return player;
  }

  removePlayer(id) {
    const player = this.netPlayers[id];
    if (player) {
      MyEventEmitter.emit('removePartyMember', player);
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
      health: this.player.health,
      name: LocalData.name,
      money: LocalData.money,
    };
  }

  spawnLevel() {
    this.glbLoader.load('/assets/Level2.glb', (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1); // Adjust size if needed
      model.traverse((child) => {
        console.log(child);
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          this.mapWalls.push(child);
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
      MyEventEmitter.emit('levelLoaded');
    });

    // Loading progress bar could be added here using the onProgress callback
    this.glbLoader.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      console.log(`Loading file: ${url}`);
      const progress = (itemsLoaded / itemsTotal) * 100;
      this.loadingBar(progress.toFixed(2));
    };
    this.glbLoader.manager.onLoad = () => {
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
    if (progress >= 100) {
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