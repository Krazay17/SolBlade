import { PerspectiveCamera, Vector3 } from "three";

export default class CameraManager {
    private static _instance: CameraManager | null = null;

    static get instance(): CameraManager {
        if(!CameraManager._instance) {
            CameraManager._instance = new CameraManager();
        }
        return CameraManager._instance;
    }
    camera: PerspectiveCamera = new PerspectiveCamera(
        80,
        window.innerWidth / window.innerHeight,
        0.1,
        5000);
    cameraOriginalPosition: Vector3 = new Vector3(0, 0, 0);
    shakeIntensity: number = 0;
    shakeDuration: number = 0;
    shakeSpeed: number = 0;
    shakeTimer: number = 0;
    constructor() { }
    update(dt: number) {
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            this.shakeTimer += dt * this.shakeSpeed;
            //const x = Math.cos(this.shakeDuration) * this.shakeIntensity;
            const y = Math.sin(this.shakeTimer) * this.shakeIntensity;
            const z = Math.sin(this.shakeTimer) * this.shakeIntensity;
            this.camera.position.set(
                this.cameraOriginalPosition.x,
                this.cameraOriginalPosition.y + y,
                this.cameraOriginalPosition.z - z
            );
        } else if (this.camera.position !== this.cameraOriginalPosition) {
            this.camera.position.lerp(this.cameraOriginalPosition, 0.1);
        }
    }
    shake(intensity: number, duration: number, speed: number) {
        this.shakeDuration = duration;
        this.shakeIntensity = intensity;
        this.shakeSpeed = speed;
    }
    resetCam() {
        this.camera.position.copy(this.cameraOriginalPosition);
    }
}