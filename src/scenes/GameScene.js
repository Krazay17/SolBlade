import * as THREE from 'three';
import SceneBase from './_SceneBase.js';
import Player from '../actors/Player.js';
import Particle from "../actors/Particle.js";

export default class GameScene extends SceneBase {
  constructor(game) {
    super(game);
    this.scene = new THREE.Scene();

    this.player = new Player(0, 0, 0);
    this.scene.add(this.player.mesh)
  }

  update(dt) {
    this.player.update(dt);
    console.log('tick');
  }

  render() {
    this.game.renderer.render(this.scene, this.game.camera);
  }
};

function clickParticles() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  canvas.addEventListener('click', (e) => {
    for (let i = 0; i < 20; i++) {
      particles.push(new Particle(e.clientX, e.clientY));
    }
  });
  const animateParticles = function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => !p.isDead());
    particles.forEach(p => {
      p.update();
      p.draw(ctx);
    });
  }
}

