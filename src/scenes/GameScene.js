import * as THREE from 'three';
import SceneBase from './_SceneBase.js';
import Player from '../actors/Player.js';
import { clickParticles, drawParticles } from "../actors/Particle.js";
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { MeshBVH, acceleratedRaycast, computeBoundsTree, MeshBVHHelper } from 'three-mesh-bvh';
import { addWorld } from '../core/Physics.js';
import { setupKeybindWindow, addButton } from '../ui/KeyBinds.js';


// Patch THREE's raycast to use BVH
THREE.Mesh.prototype.raycast = acceleratedRaycast;
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;

export default class GameScene extends SceneBase {
  constructor(game) {
    super(game);
    this.threeScene = new THREE.Scene();

    this.game.camera.position.z = 2;
    this.game.camera.lookAt(0, 0, 0);

    this.spawnLights();
    this.spawnLevel()
      .then(() => {
        this.player = new Player(0, 0, 0, this.threeScene, this.game.camera, this);
      })
      .catch(err => console.error('Error loading level', err));

    clickParticles();
    setupKeybindWindow()
    addButton('KeyUnpressed', 'KeyW', 'Heal', 1, 2);
    addButton('KeyUnpressed', 'KeyS', 'Crouch', 2, 2);
    addButton('KeyUnpressed', 'KeyA', 'Left', 2, 1);
    addButton('KeyUnpressed', 'KeyD', 'Right', 2, 3);
    addButton('KeyUnpressed', 'ShiftLeft', 'Dash', 2, 4, '100px', 'Shift');
    addButton('KeyUnpressed', 'Space', 'Jump', 2, 6, '140px');
    addButton('KeyUnpressed', 'KeyF', 'Interact', 2, 9);
    addButton('KeyUnpressed', 'KeyC', 'Inventory', 2, 10);
    addButton('KeyUnpressed', 'KeyT', 'Home', 1, 10);
    addButton('KeyUnpressed', 'KeyR', 'Respawn', 1, 9);
  }

  update(dt) {
    //this.camControl.update();
    this.player?.update(dt);
    drawParticles(dt);
  }

  spawnCubes() {
    const geom = new THREE.BoxGeometry(2, 4, 2);

    const cube1 = new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        roughness: 0.5, // matte vs shiny
        metalness: 0.3  // metallic look 
      })
    );
    cube1.position.set(5, 2, 5);
    this.threeScene.add(cube1);

    const cube2 = new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        roughness: 0.5, // matte vs shiny
        metalness: 0.3  // metallic look 
      })
    );
    cube2.position.set(2, 2, -5);
    this.threeScene.add(cube2);
  }

  spawnLights() {
    // Directional Light (main sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 100, 5);
    // Make shadow area much bigger
    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 200;

    // Increase resolution for better quality
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    dirLight.castShadow = true;
    this.threeScene.add(dirLight);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, .2);
    this.threeScene.add(ambientLight);

    // Optional: see shadow frustum
    // const helper = new THREE.CameraHelper(dirLight.shadow.camera);
    // this.threeScene.add(helper);

    // Optional helper to see light direction
    // const lightHelper = new THREE.DirectionalLightHelper(dirLight, 1);
    // this.threeScene.add(lightHelper);
  }

  spawnLevel() {
    return new Promise((resolve, reject) => {
      // Load a test world mesh
      const loader = new GLTFLoader();
      loader.load('/assets/Level1.glb', (gltf) => {
        this.worldMesh = gltf.scene.children[0];
        this.worldMesh.castShadow = true;
        this.worldMesh.receiveShadow = true;

        // Reset transform on mesh so BVH is accurate
        this.worldMesh.position.set(0, 0, 0);
        this.worldMesh.rotation.set(0, 0, 0);
        this.worldMesh.scale.set(1, 1, 1);

        this.worldMesh.geometry.computeBoundsTree();  // Compute BVH properly
        this.threeScene.add(this.worldMesh);

        // const helper = new MeshBVHHelper(this.worldMesh, 10);
        // this.threeScene.add(helper);
        addWorld(this.worldMesh);
        resolve();
      },
        undefined,
        (error) => reject(error)
      );
    })
  }
}