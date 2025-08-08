import * as THREE from 'three';

export default class Game {
  constructor() {
    this.lastTime = 0;
    this.running = true;

    this.canvas = document.getElementById('webgl');
    this.renderer = new THREE.WebGLRenderer({ alpha: 0 });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    window.addEventListener('resize', () => {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
    });

    this.scene = null;
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
      this.renderer.render(this.scene.threeScene, this.camera);
    }

    requestAnimationFrame(this.loop.bind(this));
  }
}
