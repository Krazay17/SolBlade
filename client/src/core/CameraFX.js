import { Vector3 } from "three";
import * as THREE from "three";

export default {
    init(camera) {
        this.camera = camera;
        this.cameraOriginalPosition = camera.position.clone();
        this.active = false;
    },
    shake(intensity = 1, duration = 500, speed = 0.05) {
        const originalPosition = this.camera.position.clone();
        const shakeStart = performance.now();
        this.active = true;

        const shake = (time) => {
            const elapsed = time - shakeStart;
            if (elapsed < duration) {        
                // Use angle for circular motion
                const angle = elapsed * speed;
                const x = Math.cos(angle) * intensity;
                const y = Math.sin(angle) * intensity;
                const z = Math.sin(angle) * intensity;
                this.camera.position.set(
                    originalPosition.x,
                    originalPosition.y + y,
                    originalPosition.z - z
                );
                requestAnimationFrame(shake);
            } else {
                this.active = false;
            }
        };
        requestAnimationFrame(shake);
    },
    resetCam() {
        this.camera.position.copy(this.cameraOriginalPosition);
    },
    update(dt) {
        if (this.active || this.camera.position.equals(this.cameraOriginalPosition)) return;
        this.camera.position.lerp(this.cameraOriginalPosition, 0.1);
    }
};