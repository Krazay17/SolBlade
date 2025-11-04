import * as THREE from 'three';
import Game from '../CGame';

export function spawnParticles(position, count = 8) {
    for (let i = 0; i < count; i++) {
        const geometry = new THREE.SphereGeometry(0.07, 8, 8);
        const material = new THREE.MeshLambertMaterial({
            color: 0xff2222,
            emissive: 0xff2222,
            emissiveIntensity: 1,
            blending: THREE.AdditiveBlending,
        });
        const orb = new THREE.Mesh(geometry, material);

        // Random direction and speed
        const dir = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            Math.random() * 1.5,
            (Math.random() - 0.5) * 2
        ).normalize().multiplyScalar(0.5 + Math.random() * 0.7);

        orb.position.copy(position);

        Game.getGame().graphicsWorld.add(orb);

        // Animate and remove after 0.4s
        const start = performance.now();
        function animate() {
            const elapsed = performance.now() - start;
            orb.position.add(dir.clone().multiplyScalar(0.04));
            orb.material.opacity = Math.max(0, 1 - elapsed / 400);
            orb.material.transparent = true;
            if (elapsed < 400) {
                requestAnimationFrame(animate);
            } else {
                Game.getGame().graphicsWorld.remove(orb);
                orb.geometry.dispose();
                orb.material.dispose();
            }
        }
        animate = animate.bind(this);
        animate();
    }
}