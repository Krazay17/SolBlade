import * as THREE from 'three';
import SceneBase from './_SceneBase.js';
import Player from '../actors/Player.js';
import Particle from "../actors/Particle.js";
import { PointerLockControls } from 'three/examples/jsm/Addons.js';

export default class GameScene extends SceneBase {
  constructor(game) {
    super(game);
    this.threeScene = new THREE.Scene();

    this.game.camera.position.z = 5;
    this.game.camera.lookAt(0, 0, 0);

    clickParticles();

    // Floor
    const floorGeom = new THREE.PlaneGeometry(50, 50);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2; // lay flat
    floor.position.y = -1;
    floor.receiveShadow = true;
    this.threeScene.add(floor);

    // Directional Light (main sun)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    this.threeScene.add(dirLight);

    // Optional helper to see light direction
    // const lightHelper = new THREE.DirectionalLightHelper(dirLight, 1);
    // this.scene.add(lightHelper);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, .2);
    this.threeScene.add(ambientLight);

    //this.camControl = new PointerLockControls(this.game.camera, document.body);

    this.player = new Player(0, 0, 0, this.threeScene, this.game.camera);
    this.threeScene.add(this.player.mesh)
    // Attach camera to player at head height
    // this.player.mesh.add(this.game.camera);
    // this.game.camera.position.set(0, 0, 0);


    // Click to lock the pointer
    // document.addEventListener('click', () => {
    //   this.camControl.lock();
    // });
    // // Optional: listen for lock/unlock
    // this.camControl.addEventListener('lock', () => {
    //   console.log('Pointer locked');
    // });
    // this.camControl.addEventListener('unlock', () => {
    //   console.log('Pointer unlocked');
    // });



  }

  update(dt) {
    //this.camControl.update();
    this.player.update(dt);
    drawParticles(dt);
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