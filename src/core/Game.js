import * as THREE from 'three';

export default class Game {
  constructor() {
    this.lastTime = 0;
    this.running = true;

    const canvas = document.getElementById('canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.camera.position.z = 5;
    this.camera.lookAt(0, 0, 0);

    this.scene = null; // Current scene (set later)

    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

  }

  setScene(scene) {
    if (this.scene?.onExit) this.scene.onExit();
    this.scene = scene;
    if (this.scene?.onEnter) this.scene.onEnter();
  }

  start() {
    requestAnimationFrame(this.loop.bind(this));
  }

  loop(time) {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    if (this.running && this.scene) {
      this.scene.update(dt);
      this.scene.render();
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}