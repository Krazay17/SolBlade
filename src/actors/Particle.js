export default class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 5 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.alpha = 1;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha = Math.max(0, this.alpha -= 0.01);
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.alpha <= 0;
    }
}


let particles = [];
let canvas, ctx;

export function clickParticles() {
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

export function drawParticles(dt) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles = particles.filter(p => !p.isDead());
  particles.forEach(p => {
    p.update(dt);
    p.draw(ctx);
  });
}

export function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}