import * as THREE from 'three';
import * as CANNON from 'cannon';
import SceneBase from './_SceneBase.js';
import Player from '../actors/Player.js';
import { clickParticles, drawParticles } from "../actors/Particle.js";
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { getMaterial } from '../core/MaterialManager.js';
import { playerNetData, setNetScene } from '../core/NetManager.js';
import LocalData from '../core/LocalData.js';

export default class GameScene extends SceneBase {
  onEnter() {
    this.name = 'level1';
    this.spawnLevel();
    this.netPlayers = {};
    this.player = new Player(this.game, this, LocalData.position, true, this.game.camera);

    this.makeSky();
    clickParticles();
    setNetScene(this, playerNetData({ scene: this.name, pos: LocalData.position, name: LocalData.name, money: LocalData.money }));
  }

  update(dt, time) {
    if (this.player) {
      this.player.update(dt, time);
    }
    if (this.netPlayers) {
      Object.values(this.netPlayers).forEach(player => {
        player.update(dt, time);
      });
    }
  }

  makeSky() {
    const skyGeo = new THREE.SphereGeometry(2500, 25, 25);
    const myTexture = new THREE.TextureLoader().load('assets/RedSky0.webp');
    const myMaterial = new THREE.MeshBasicMaterial({
      map: myTexture,
      side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, myMaterial);
    this.game.graphicsWorld.add(sky);
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
    console.log(data);
    const player = new Player(this.game, this, data.pos, false);
    this.netPlayers[id] = player;
    return player;
  }

  fullNetSync() {
    if (!this.player) return null;
    return playerNetData({
      scene: this.name,
      pos: this.player.body.position,
      rot: this.player.rotation,
      state: this.player.getState(),
      name: LocalData.name,
      money: LocalData.money,
    });
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
          });
          body.position.copy(child.getWorldPosition(new THREE.Vector3()));
          body.quaternion.copy(child.getWorldQuaternion(new THREE.Quaternion()));
          this.game.physicsWorld.addBody(body);
        }
      });
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