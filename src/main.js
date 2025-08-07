import Particle from "./particle";

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particles = [];

canvas.addEventListener('click', (e) => {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(e.clientX, e.clientY));
    }
});

window.addEventListener('resize', () =>{
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
})

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => !p.isDead());
    particles.forEach(p => {
        p.update();
        p.draw(ctx);
    });
    requestAnimationFrame(animate);
}

animate();