import * as THREE from 'three';
import SceneBase from './_SceneBase.js';
import Player from '../actors/Player.js';
import Particle from "../actors/Particle.js";
import { PointerLockControls } from 'three/examples/jsm/Addons.js';
import { addPhysics } from '../core/Physics.js';

export default class GameScene extends SceneBase {
  constructor(game) {
    super(game);
    this.threeScene = new THREE.Scene();

    this.game.camera.position.z = 5;
    this.game.camera.lookAt(0, 0, 0);

    clickParticles();

    // Floor
    const floorGeom = new THREE.PlaneGeometry(100, 100);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2; // lay flat
    floor.position.y = -.5;
    floor.receiveShadow = true;
    this.threeScene.add(floor);

    // Directional Light (main sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    // Make shadow area much bigger
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 100;

    // Increase resolution for better quality
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    dirLight.castShadow = true;
    this.threeScene.add(dirLight);

    // Optional: see shadow frustum
    // const helper = new THREE.CameraHelper(dirLight.shadow.camera);
    // this.threeScene.add(helper);

    // Optional helper to see light direction
    // const lightHelper = new THREE.DirectionalLightHelper(dirLight, 1);
    // this.scene.add(lightHelper);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, .2);
    this.threeScene.add(ambientLight);

    this.player = new Player(0, 0, 0, this.threeScene, this.game.camera);
    this.threeScene.add(this.player.mesh)
    addPhysics(this.player.mesh);

    this.spawnCubes();
  }

  update(dt) {
    //this.camControl.update();
    this.player.update(dt);
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
    cube1.position.set(5, 0, 5);
    this.threeScene.add(cube1);

    const cube2 = new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        roughness: 0.5, // matte vs shiny
        metalness: 0.3  // metallic look 
      })
    );
    cube2.position.set(2, 0, -5);
    this.threeScene.add(cube2);

  }
}

let particles = [];
let canvas, ctx;

function clickParticles() {
  canvas = document.getElementById('particles');
  ctx = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  canvas.addEventListener('click', (e) => {
    for (let i = 0; i < 20; i++) {
      particles.push(new Particle(e.clientX, e.clientY));
    }
  });
}

function drawParticles(dt) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => !p.isDead());
  particles.forEach(p => {
    p.update(dt);
    p.draw(ctx);
  });
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}